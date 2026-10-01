import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { privatePaymentLinks, projects } from "@/db/schema";
import { resolveCanonicalAuthSession } from "@/lib/hermes/auth/canonical-resolver";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const PANDORAS_TREASURY_WALLET = process.env.NEXT_PUBLIC_PANDORAS_TREASURY_WALLET || "0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9";
const PLAN_PRICES = {
  "growth-starter": { amount: 1500, title: "Growth Starter - Mensual", product: "GROWTH_STARTER_MONTHLY" },
  "growth-pro": { amount: 3000, title: "Growth Pro - Mensual", product: "GROWTH_PRO_MONTHLY" },
};

export async function POST(req: NextRequest) {
  try {
    const session = await resolveCanonicalAuthSession(req);
    if (!session || !session.projectSlug) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { planId } = await req.json().catch(() => ({}));
    if (!planId || !(planId in PLAN_PRICES)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const plan = PLAN_PRICES[planId as keyof typeof PLAN_PRICES];

    // Find project
    const [project] = await db.select({ id: projects.id })
      .from(projects).where(eq(projects.slug, session.projectSlug)).limit(1);

    if (!project) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    // P1-5: Create intent targeting Pandora's Treasury (PlatformBillingContext)
    const [intent] = await db.insert(privatePaymentLinks).values({
      title: plan.title,
      description: `Suscripción para la organización ${session.projectSlug}`,
      amount: plan.amount.toString(),
      currency: "USD",
      destinationWallet: PANDORAS_TREASURY_WALLET.toLowerCase(),
      networkChainId: process.env.NODE_ENV === "production" ? 8453 : 11155111,
      status: "active",
      metadata: {
        vertical: "GROWTH_OS",
        tenantId: session.projectSlug,
        projectId: project.id,
        productId: plan.product,
        context: "PlatformBilling",
      }
    }).returning();

    if (!intent) {
      return NextResponse.json({ error: "No se pudo crear la intención" }, { status: 500 });
    }

    return NextResponse.json({ success: true, intentId: intent.id });
  } catch (error: any) {
    console.error("[Billing] Error creating billing intent:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
