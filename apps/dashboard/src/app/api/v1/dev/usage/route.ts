import { NextRequest, NextResponse } from "next/server";
import { integrationGuard } from "@/lib/integrations/guard";
import { QuotaMeteringService } from "@/lib/integrations/quota-metering";
import { db } from "@saasfly/db-core";
import { installedProducts } from "@saasfly/db-core";
import { eq, and, inArray } from "@saasfly/db-core";

export const runtime = "nodejs";

/**
 * GET /api/v1/dev/usage
 * Consulta en tiempo real las métricas de consumo de cuota mensual y rate limit para el tenant.
 * Aislamiento estricto: Derivado directamente del client autorizado.
 */
export async function GET(req: NextRequest) {
  try {
    const guardResult = await integrationGuard(req, {
      requiredCapability: "events:write",
    });

    if (!guardResult.ok) {
      return NextResponse.json({ error: guardResult.error }, { status: guardResult.status });
    }

    const { client } = guardResult;

    // Resolver plan comercial si existe
    let plan: "sandbox" | "starter" | "growth" | "enterprise" = "sandbox";
    if (client.projectId) {
      const entitlement = await db.query.installedProducts.findFirst({
        where: and(
          eq(installedProducts.projectId, client.projectId),
          eq(installedProducts.productFamily, "DEVELOPER"),
          eq(installedProducts.product, "DEV_ACCESS"),
          inArray(installedProducts.status, ["trial", "active"])
        ),
        columns: { plan: true },
      });
      if (entitlement?.plan && ["starter", "growth", "enterprise"].includes(entitlement.plan)) {
        plan = entitlement.plan as "starter" | "growth" | "enterprise";
      }
    }

    const metrics = await QuotaMeteringService.getUsageMetrics({
      clientId: client.id,
      projectId: client.projectId,
      environment: client.environment as "staging" | "production",
      plan,
    });

    return NextResponse.json({
      success: true,
      tenantId: client.projectId,
      ...metrics,
    });
  } catch (error: any) {
    console.error("❌ [DevUsageAPI] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error?.message || "Error al consultar métricas de cuota." },
      { status: 500 }
    );
  }
}
