import { NextRequest, NextResponse } from "next/server";
import { integrationGuard } from "@/lib/integrations/guard";
import { db } from "@saasfly/db-core";
import { webhookEvents } from "@saasfly/db-core";
import { eq, desc } from "@saasfly/db-core";

export const runtime = "nodejs";

/**
 * GET /api/v1/dev/logs
 * Recupera el registro histórico de eventos y entregas de webhooks para el tenant autenticado.
 * Aislamiento estricto (FC-001 / FC-006): Solo consulta eventos vinculados a client.id.
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
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Consulta de eventos recientes despachados por este cliente
    const events = await db.query.webhookEvents.findMany({
      where: eq(webhookEvents.clientId, client.id),
      orderBy: [desc(webhookEvents.createdAt)],
      limit,
    });

    const formattedEvents = events.map((ev) => ({
      id: ev.id,
      event: ev.event,
      status: ev.status,
      attempts: ev.attempts,
      payload: ev.payload,
      nextRetryAt: ev.nextRetryAt ? ev.nextRetryAt.toISOString() : null,
      createdAt: ev.createdAt.toISOString(),
      updatedAt: ev.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      tenantId: client.projectId,
      environment: client.environment,
      count: formattedEvents.length,
      events: formattedEvents,
    });
  } catch (error: any) {
    console.error("❌ [DevLogsAPI] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error?.message || "Error al consultar logs de eventos." },
      { status: 500 }
    );
  }
}
