import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { privatePaymentLinks } from "@saasfly/db-core";
import { resolveTreasuryWallet } from '@/lib/payments/treasury';
import { resolvePrivateAdmin } from '@/lib/private-admin';
import { getPaymentLimits } from '@/lib/payments/limits';
import { z } from "zod";
import { desc } from "@saasfly/db-core";

export const runtime = "nodejs";

const CreatePrivateLinkSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(255),
  description: z.string().optional(),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  currency: z.string().default("USD"),
  destinationWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/i, "Dirección de wallet inválida"),
  networkChainId: z.number().default(8453), // Default to Base
  settlementToken: z.string().regex(/^0x[a-fA-F0-9]{40}$/i).optional().nullable(),
  expiresInDays: z.number().min(1).max(365).optional(),
  // Métodos habilitados en el checkout público. 'card' usa el CheckoutWidget de thirdweb.
  methods: z.array(z.enum(["crypto", "wire", "card"])).min(1).default(["crypto"]),
});

export async function GET(req: NextRequest) {
  const { actor, errorResponse } = await resolvePrivateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const links = await db.query.privatePaymentLinks.findMany({
      orderBy: [desc(privatePaymentLinks.createdAt)],
      limit: 50,
    });

    const treasury = resolveTreasuryWallet();
    const limits = getPaymentLimits();

    return NextResponse.json({
      success: true,
      links,
      admin: actor,
      // Wallet del entorno: la terminal la usa como valor por defecto, no como autoridad.
      defaultDestinationWallet: treasury.ok ? treasury.wallet : null,
      // Mínimos por método (la terminal los muestra y valida antes de crear).
      limits,
    });
  } catch (error: any) {
    console.error("[PrivatePayments API] Error listing links:", error);
    return NextResponse.json({ error: error?.message || "Failed to load private payment links" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { actor, errorResponse } = await resolvePrivateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = CreatePrivateLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      amount,
      currency,
      destinationWallet,
      networkChainId,
      settlementToken,
      expiresInDays,
      methods,
    } = parsed.data;

    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Mínimo por método: si se habilita tarjeta y el monto es menor al mínimo de la
    // rampa, el link nacería imposible de pagar (onramp/prepare responde 400).
    const limits = getPaymentLimits();
    const isUsd = currency.toUpperCase() === 'USD';
    if (methods.includes('card') && isUsd && amount < limits.cardMinUsd) {
      return NextResponse.json(
        {
          error: `El mínimo para cobrar con tarjeta es ${limits.cardMinUsd} USD. Sube el monto o deshabilita la tarjeta.`,
          code: 'BELOW_CARD_MINIMUM',
          cardMinUsd: limits.cardMinUsd,
        },
        { status: 422 }
      );
    }

    const [created] = await db
      .insert(privatePaymentLinks)
      .values({
        title,
        description: description || null,
        amount: amount.toFixed(2),
        currency: currency.toUpperCase(),
        destinationWallet: destinationWallet.toLowerCase(),
        networkChainId,
        settlementToken: settlementToken ? settlementToken.toLowerCase() : null,
        expiresAt,
        status: "active",
        metadata: {
          createdByUser: actor,
          createdByWallet: actor,
          methods,
        },
      })
      .returning();

    if (!created) {
      return NextResponse.json({ error: "Failed to persist private payment link" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      link: created,
      paymentUrl: `/pay/private/${created.id}`,
    });
  } catch (error: any) {
    console.error("[PrivatePayments API] Error creating link:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
