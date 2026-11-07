import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@saasfly/db-core';
import { privatePaymentLinks } from '@saasfly/db-core/schema';
import { desc } from '@saasfly/db-core';
import { getNexusAuthContext, getTrustedClientIp, authRateLimiter } from '@saasfly/shared';
import {
  isValidDestinationWallet,
  resolvePayoutOptions,
  resolveTreasuryWallet,
} from '@/lib/payments/treasury';

/**
 * GET/POST /api/nexus/payments/links
 *
 * Piloto de cobro con tarjeta (thirdweb Checkout) para el SUPER_ADMIN.
 *
 * Autoridad (server-side, nunca del body):
 *   - Solo SUPER_ADMIN autenticado por sesión Nexus.
 *   - La wallet destino la resuelve el servidor desde el entorno (fail-closed).
 *   - El monto lo define el operador aquí; el checkout del pagador NO puede alterarlo
 *     (el settle verifica contra el monto del link).
 *
 * Tabla: `private_payment_links` porque su `destinationWallet` es NOT NULL y
 * `/api/v1/payments/settle` ya la liquida con verificación on-chain.
 */

export const dynamic = 'force-dynamic';

const MAX_AMOUNT_USD = 100_000;
const LINK_TTL_DAYS = 7;
const PILOT_CHANNEL = 'nexus_card_pilot';

const AMOUNT_REGEX = /^\d{1,6}(\.\d{1,2})?$/;

interface CreateBody {
  amount?: unknown;
  title?: unknown;
  description?: unknown;
  destinationWallet?: unknown;
}

function forbidden(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}

export async function GET(req: NextRequest) {
  const auth = await getNexusAuthContext(req.headers, null, 'NEXUS');
  if (!auth.isAuthenticated) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (auth.role !== 'SUPER_ADMIN') {
    return forbidden('Solo el SUPER_ADMIN puede ver los cobros.');
  }

  const treasury = resolveTreasuryWallet();
  const payoutOptions = resolvePayoutOptions();

  const links = await db
    .select({
      id: privatePaymentLinks.id,
      title: privatePaymentLinks.title,
      amount: privatePaymentLinks.amount,
      currency: privatePaymentLinks.currency,
      status: privatePaymentLinks.status,
      networkChainId: privatePaymentLinks.networkChainId,
      destinationWallet: privatePaymentLinks.destinationWallet,
      createdAt: privatePaymentLinks.createdAt,
      expiresAt: privatePaymentLinks.expiresAt,
      metadata: privatePaymentLinks.metadata,
    })
    .from(privatePaymentLinks)
    .orderBy(desc(privatePaymentLinks.createdAt))
    .limit(25);

  return NextResponse.json({
    ok: true,
    treasury: treasury.ok
      ? { configured: true, wallet: treasury.wallet, source: treasury.source }
      : { configured: false, reason: treasury.reason },
    payoutOptions,
    links,
  });
}

export async function POST(req: NextRequest) {
  const ip = getTrustedClientIp(req.headers);
  if (!(await authRateLimiter.isAllowed(`nexus-payments-link:ip:${ip}`))) {
    return NextResponse.json(
      { ok: false, error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      { status: 429 }
    );
  }

  const auth = await getNexusAuthContext(req.headers, null, 'NEXUS');
  if (!auth.isAuthenticated) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (auth.role !== 'SUPER_ADMIN') {
    return forbidden('Solo el SUPER_ADMIN puede generar cobros.');
  }

  let body: CreateBody = {};
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido.' }, { status: 400 });
  }

  const rawAmount = typeof body.amount === 'string' ? body.amount.trim() : String(body.amount ?? '').trim();
  if (!AMOUNT_REGEX.test(rawAmount)) {
    return NextResponse.json(
      { ok: false, error: 'Monto inválido. Usa hasta 6 enteros y 2 decimales (ej. 1500.00).' },
      { status: 422 }
    );
  }
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT_USD) {
    return NextResponse.json(
      { ok: false, error: `El monto debe ser mayor a 0 y menor o igual a ${MAX_AMOUNT_USD} USD.` },
      { status: 422 }
    );
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title.length < 3 || title.length > 120) {
    return NextResponse.json(
      { ok: false, error: 'El concepto debe tener entre 3 y 120 caracteres.' },
      { status: 422 }
    );
  }

  const description =
    typeof body.description === 'string' && body.description.trim()
      ? body.description.trim().slice(0, 500)
      : null;

  // ── Destino del cobro ────────────────────────────────────────────────────────
  // Default = wallet del entorno (Pandora's). El operador (SUPER_ADMIN) puede
  // elegir otra: se valida formato y se rechaza la dirección cero. La wallet queda
  // fijada en el link: un enlace ya enviado no puede cambiar de destino.
  const requestedDestination =
    typeof body.destinationWallet === 'string' ? body.destinationWallet.trim() : '';

  let destinationWallet: string;
  let destinationSource: 'default' | 'allowlist' | 'custom';
  let destinationLabel: string | null = null;

  if (requestedDestination) {
    if (!isValidDestinationWallet(requestedDestination)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'La wallet destino no es válida. Debe ser una dirección 0x de 40 caracteres hexadecimales y no puede ser la dirección cero.',
          code: 'INVALID_DESTINATION',
        },
        { status: 422 }
      );
    }
    destinationWallet = requestedDestination.toLowerCase();

    const match = resolvePayoutOptions().find((option) => option.address === destinationWallet);
    destinationSource = match ? (match.isDefault ? 'default' : 'allowlist') : 'custom';
    destinationLabel = match?.label ?? null;
  } else {
    const treasury = resolveTreasuryWallet();
    if (!treasury.ok) {
      return NextResponse.json(
        { ok: false, error: treasury.reason, code: 'TREASURY_NOT_CONFIGURED' },
        { status: 503 }
      );
    }
    destinationWallet = treasury.wallet;
    destinationSource = 'default';
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000);

  const [link] = await db
    .insert(privatePaymentLinks)
    .values({
      title,
      description,
      amount: amount.toFixed(2),
      currency: 'USD',
      destinationWallet,
      // El settle fuerza Base mainnet en producción; el widget debe usar la misma red.
      networkChainId: 8453,
      settlementToken: null, // null => USDC por defecto en el settle
      status: 'active',
      expiresAt,
      metadata: {
        channel: PILOT_CHANNEL,
        createdBy: auth.email ?? auth.role,
        createdByWallet: auth.wallet ?? null,
        methods: ['card'],
        origin: 'nexus.payments',
        // Trazabilidad: quién eligió el destino y de dónde salió.
        destinationSource,
        destinationLabel,
      },
    })
    .returning({ id: privatePaymentLinks.id, amount: privatePaymentLinks.amount });

  if (!link) {
    return NextResponse.json({ ok: false, error: 'No se pudo crear el link de cobro.' }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      link: {
        id: link.id,
        amount: link.amount,
        currency: 'USD',
        url: `/pay/card/${link.id}`,
        expiresAt: expiresAt.toISOString(),
        destinationWallet,
        destinationSource,
      },
    },
    { status: 201 }
  );
}
