import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createPublicClient, decodeEventLog, erc20Abi, http, parseUnits, type Chain, type Hash } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { db } from '@saasfly/db';
import { hermesCreditDeposits } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';
import { TenantBillingService } from '@saasfly/hermes-core';
import { resolveTreasuryWallet } from '@/lib/payments/treasury';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v1/hermes/billing/deposit
 *
 * Recarga de saldo del tenant desde el Hermes Portal.
 *
 * Seguridad (producción):
 *  - Requiere sesión de portal; el tenant autoritativo es el de la sesión.
 *  - El saldo real exige un `txHash` de pago **verificado on-chain**: recibo
 *    exitoso + transferencia ERC-20 al treasury por importe >= solicitado.
 *  - Idempotencia estricta: `hermes_credit_deposits.tx_hash` es único global; un
 *    mismo pago no puede acreditarse dos veces (replay → 409).
 *  - El abono se hace con `TenantBillingService.processDeposit` (única vía de
 *    crédito, deja evento de fondeo). Si el abono falla, se elimina el registro de
 *    depósito para permitir reintentar.
 *
 * Sandbox: crédito de prueba, sin txHash; se registra con `txHash = sandbox_…`.
 */

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const MIN_TOPUP_USD = 5;

const CHAINS: Record<number, { chain: Chain; usdc: `0x${string}` }> = {
  8453: { chain: base, usdc: USDC_BASE },
  11155111: { chain: baseSepolia, usdc: USDC_SEPOLIA },
};

interface DepositBody {
  tenantId?: unknown;
  amountUsd?: unknown;
  isSandbox?: unknown;
  txHash?: unknown;
  chainId?: unknown;
  note?: unknown;
}

function isTxHash(value: unknown): value is Hash {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value);
}

async function verifyOnChainDeposit(params: {
  txHash: Hash;
  chainId: number;
  treasury: string;
  amountUsd: number;
}): Promise<{ ok: true; blockNumber: string; from: string | null } | { ok: false; reason: string }> {
  const cfg = CHAINS[params.chainId];
  if (!cfg) return { ok: false, reason: `Unsupported chainId: ${params.chainId}` };

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && params.chainId !== 8453) {
    return { ok: false, reason: 'En producción los depósitos sólo se aceptan en Base mainnet (8453).' };
  }

  try {
    const publicClient = createPublicClient({ chain: cfg.chain, transport: http() });
    const receipt = await publicClient.getTransactionReceipt({ hash: params.txHash });
    if (!receipt) return { ok: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (receipt.status === 'reverted') return { ok: false, reason: 'TRANSACTION_REVERTED' };

    const expected = parseUnits(params.amountUsd.toFixed(4), 6); // USDC 6 decimales
    let from: string | null = null;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== cfg.usdc.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics });
        if (decoded.eventName !== 'Transfer') continue;
        const args = decoded.args as unknown as { from: string; to: string; value: bigint };
        if (args.to.toLowerCase() !== params.treasury.toLowerCase()) continue;
        if (args.value < expected) continue;
        from = args.from.toLowerCase();
        return { ok: true, blockNumber: receipt.blockNumber.toString(), from };
      } catch {
        // log no ERC-20: se ignora
      }
    }

    return { ok: false, reason: 'NO_MATCHING_TRANSFER_TO_TREASURY_FOR_AMOUNT' };
  } catch (error: unknown) {
    console.error('[HermesDeposit] On-chain verification failed:', error);
    return { ok: false, reason: 'VERIFICATION_ERROR' };
  }
}

/**
 * GET /api/v1/hermes/billing/deposit
 * Datos para que el portal muestre a dónde pagar (wallet de tesorería + red).
 * Requiere sesión de portal.
 */
export async function GET(req: NextRequest) {
  const tenant = new URL(req.url).searchParams.get('tenantId') ?? '';
  try {
    const { tryResolvePortalContext } = await import('@/lib/portal/resolve-portal-context');
    const portalCtx = tenant ? await tryResolvePortalContext(tenant) : null;
    if (!portalCtx && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ ok: false, error: 'Sesión de portal requerida.' }, { status: 403 });
    }
  } catch {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ ok: false, error: 'Sesión de portal requerida.' }, { status: 403 });
    }
  }

  const treasury = resolveTreasuryWallet();
  return NextResponse.json({
    ok: true,
    minTopupUsd: MIN_TOPUP_USD,
    chainId: process.env.NODE_ENV === 'production' ? 8453 : 11155111,
    treasury: treasury.ok ? treasury.wallet : null,
    usdc: process.env.NODE_ENV === 'production' ? USDC_BASE : USDC_SEPOLIA,
    treasuryConfigured: treasury.ok,
  });
}

export async function POST(req: NextRequest) {
  let body: DepositBody = {};
  try {
    body = (await req.json()) as DepositBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const requestedTenant = typeof body.tenantId === 'string' ? body.tenantId.trim().toLowerCase() : '';
  if (!requestedTenant) {
    return NextResponse.json({ ok: false, error: 'tenantId es requerido.' }, { status: 400 });
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // Autoridad: la sesión de portal manda. El tenantId del body sólo es válido en dev.
  let authorizedTenant = requestedTenant;
  try {
    const { tryResolvePortalContext } = await import('@/lib/portal/resolve-portal-context');
    const portalCtx = await tryResolvePortalContext(requestedTenant);
    if (portalCtx) {
      const slug = portalCtx.organization?.slug;
      if (typeof slug === 'string' && slug.length > 0) authorizedTenant = slug.toLowerCase();
    } else if (isProduction) {
      return NextResponse.json(
        { ok: false, error: 'Acceso no autorizado: se requiere sesión activa de portal para fondear saldo.' },
        { status: 403 }
      );
    }
  } catch (error: unknown) {
    console.error('[HermesDeposit] Portal session resolution failed:', error);
    if (isProduction) {
      return NextResponse.json(
        { ok: false, error: 'No se pudo validar la sesión de portal.' },
        { status: 401 }
      );
    }
  }

  const amountUsd = Number(body.amountUsd);
  if (!Number.isFinite(amountUsd) || amountUsd < MIN_TOPUP_USD) {
    return NextResponse.json(
      { ok: false, error: `El monto mínimo de recarga es de $${MIN_TOPUP_USD.toFixed(2)} USD.` },
      { status: 422 }
    );
  }

  const isSandbox = body.isSandbox === true;
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 400) : null;

  try {
    // ── Sandbox: dinero de prueba, sin pago ────────────────────────────────────
    if (isSandbox) {
      const sandboxTx = `sandbox_${crypto.randomUUID()}`;
      await db.insert(hermesCreditDeposits).values({
        id: `dep_${crypto.randomUUID()}`,
        tenantId: authorizedTenant,
        amountUsd: amountUsd.toFixed(4),
        isSandbox: true,
        txHash: sandboxTx,
        creditedBy: 'portal:sandbox',
        note,
      });

      const result = await TenantBillingService.processDeposit({
        tenantId: authorizedTenant,
        amountUsd,
        isSandbox: true,
        paymentMethod: 'manual',
        transactionHash: sandboxTx,
      });

      return NextResponse.json({ ...result, ok: true, sandbox: true });
    }

    // ── Saldo real: pago on-chain verificado ───────────────────────────────────
    const treasury = resolveTreasuryWallet();
    if (!treasury.ok) {
      return NextResponse.json(
        { ok: false, error: treasury.reason, code: 'TREASURY_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    const txHash = body.txHash;
    if (!isTxHash(txHash)) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere el txHash (0x + 64 hex) del pago on-chain.' },
        { status: 422 }
      );
    }

    const chainId = Number(body.chainId ?? (isProduction ? 8453 : 11155111));
    const chainCfg = CHAINS[chainId];
    if (!chainCfg) {
      return NextResponse.json(
        { ok: false, error: `chainId no soportado. Usa ${Object.keys(CHAINS).join(' o ')}.` },
        { status: 422 }
      );
    }

    const normalizedHash = txHash.toLowerCase();

    // Idempotencia: si el tx ya se acreditó, no se vuelve a abonar.
    const [already] = await db
      .select({ id: hermesCreditDeposits.id })
      .from(hermesCreditDeposits)
      .where(eq(hermesCreditDeposits.txHash, normalizedHash))
      .limit(1);

    if (already) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Este pago ya fue acreditado. Un txHash sólo puede usarse una vez.',
          code: 'TX_ALREADY_CREDITED',
        },
        { status: 409 }
      );
    }

    const verification = await verifyOnChainDeposit({
      txHash: normalizedHash as Hash,
      chainId,
      treasury: treasury.wallet,
      amountUsd,
    });
    if (!verification.ok) {
      return NextResponse.json(
        { ok: false, error: 'El pago no se pudo verificar on-chain.', reason: verification.reason },
        { status: 422 }
      );
    }

    const depositId = `dep_${crypto.randomUUID()}`;
    try {
      await db.insert(hermesCreditDeposits).values({
        id: depositId,
        tenantId: authorizedTenant,
        amountUsd: amountUsd.toFixed(4),
        isSandbox: false,
        chainId,
        tokenAddress: chainCfg.usdc.toLowerCase(),
        txHash: normalizedHash,
        fromAddress: verification.from,
        toAddress: treasury.wallet,
        blockNumber: verification.blockNumber,
        creditedBy: 'portal:onchain',
        note,
      });
    } catch (insertError: unknown) {
      // Violación del índice único = pago ya acreditado (replay).
      console.warn('[HermesDeposit] Replay or duplicate txHash rejected:', insertError);
      return NextResponse.json(
        {
          ok: false,
          error: 'Este pago ya fue acreditado. Un txHash sólo puede usarse una vez.',
          code: 'TX_ALREADY_CREDITED',
        },
        { status: 409 }
      );
    }

    try {
      const result = await TenantBillingService.processDeposit({
        tenantId: authorizedTenant,
        amountUsd,
        isSandbox: false,
        paymentMethod: 'crypto',
        transactionHash: normalizedHash,
        payerWallet: verification.from ?? undefined,
      });

      return NextResponse.json({
        ...result,
        ok: true,
        txHash: normalizedHash,
        chainId,
        blockNumber: verification.blockNumber,
      });
    } catch (creditError: unknown) {
      // Compensación: si no se pudo abonar, se libera el txHash para reintentar.
      await db
        .delete(hermesCreditDeposits)
        .where(eq(hermesCreditDeposits.id, depositId))
        .catch(() => undefined);
      console.error('[HermesDeposit] Credit failed, deposit record rolled back:', depositId, creditError);
      throw creditError;
    }
  } catch (error: unknown) {
    console.error('[HermesDeposit] Failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Error al procesar el depósito.' },
      { status: 500 }
    );
  }
}
