import { NextRequest, NextResponse } from "next/server";
import { integrationGuard } from "@/lib/integrations/guard";
import { db } from "@saasfly/db-core";
import { marketingLeads } from "@saasfly/db-core";
import { eq, and, or } from "@saasfly/db-core";

export const runtime = "nodejs";

/**
 * GET /api/v1/leads/status
 * Consulta de estado de prospecto/lead para el tenant autorizado.
 * 
 * Invariantes (FC-001, FC-003, FC-006):
 * 1. Autenticación con API Key vía integrationGuard.
 * 2. Scope de Tenant estricto: Solo consulta leads donde marketingLeads.projectId === client.projectId.
 * 3. Prohibido filtrar o consultar leads de otros proyectos.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Guard Común de Integración (Capability + Resource Scope)
    const guardResult = await integrationGuard(req, {
      requiredCapability: "events:write",
    });

    if (!guardResult.ok) {
      return NextResponse.json({ error: guardResult.error }, { status: guardResult.status });
    }

    const { client } = guardResult;

    if (client.projectId === null || client.projectId === undefined) {
      return NextResponse.json(
        { error: "FORBIDDEN: La credencial no está vinculada a ningún proyecto/tenant." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!leadId && !email) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: Se requiere 'leadId' o 'email' como parámetro de consulta." },
        { status: 400 }
      );
    }

    // 2. Consulta autoritativa en base de datos con aislamiento de tenant
    let queryCondition = eq(marketingLeads.projectId, client.projectId);

    if (leadId) {
      queryCondition = and(queryCondition, eq(marketingLeads.id, leadId as any)) as any;
    } else if (email) {
      queryCondition = and(queryCondition, eq(marketingLeads.email, email)) as any;
    }

    const lead = await db.query.marketingLeads.findFirst({
      where: queryCondition,
      columns: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        status: true,
        intent: true,
        score: true,
        quality: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "NOT_FOUND: No se encontró ningún prospecto con los criterios provistos en este tenant." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        email: lead.email,
        name: lead.name,
        phone: lead.phoneNumber,
        status: lead.status,
        intent: lead.intent,
        score: lead.score,
        quality: lead.quality,
        source: lead.source,
        createdAt: lead.createdAt ? lead.createdAt.toISOString() : null,
        updatedAt: lead.updatedAt ? lead.updatedAt.toISOString() : null,
      },
    });

  } catch (error: any) {
    console.error("❌ [GetLeadStatusAPI] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al consultar estado de lead." },
      { status: 500 }
    );
  }
}
