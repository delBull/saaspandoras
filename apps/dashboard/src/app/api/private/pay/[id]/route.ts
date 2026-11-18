import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { privatePaymentLinks } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { getPaymentLimits, usableMethods, type PaymentMethod } from "@/lib/payments/limits";

export const runtime = "nodejs";

/**
 * 🔒 Public Details Endpoint for a Private Payment
 * Returns ONLY what the checkout needs: title, amount, destination wallet, network.
 * Zero leaks of admin identity, zero relation with CRM or tenants.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing link ID" }, { status: 400 });
    }

    const link = await db.query.privatePaymentLinks.findFirst({
      where: eq(privatePaymentLinks.id, id),
    });

    if (!link) {
      return NextResponse.json({ error: "Link de pago no encontrado" }, { status: 404 });
    }

    if (link.status !== "active") {
      return NextResponse.json({ error: "Este link ya no está activo" }, { status: 410 });
    }

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return NextResponse.json({ error: "Este link ha expirado" }, { status: 410 });
    }

    // Métodos permitidos por el link, filtrados por los mínimos de cada método.
    // Así el pagador no ve una pestaña que la rampa va a rechazar.
    const rawMethods = (link.metadata as Record<string, unknown> | null)?.methods;
    const declared = Array.isArray(rawMethods)
      ? rawMethods.filter(
          (m): m is PaymentMethod => m === "crypto" || m === "wire" || m === "card"
        )
      : (["crypto"] as PaymentMethod[]);
    const { usable, blocked } = usableMethods(declared, Number(link.amount), link.currency);

    return NextResponse.json({
      success: true,
      data: {
        id: link.id,
        title: link.title,
        description: link.description,
        amount: link.amount,
        currency: link.currency,
        destinationWallet: link.destinationWallet,
        networkChainId: link.networkChainId,
        settlementToken: link.settlementToken,
        // Métodos realmente utilizables para este monto (ya filtrados por mínimos).
        methods: usable,
        blockedMethods: blocked,
        limits: getPaymentLimits(),
      },
    });
  } catch (error: any) {
    console.error("[PrivatePay API] Error fetching link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
