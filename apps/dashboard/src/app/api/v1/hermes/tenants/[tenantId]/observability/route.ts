import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesConversations, hermesEscalations } from '@/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hermes/tenants/[tenantId]/observability
 *
 * Operational metrics for the Hermes HITL inbox:
 *   - Conversation status breakdown (ACTIVE / PAUSED_HUMAN / RESOLVED)
 *   - Escalation funnel (PENDING / IN_PROGRESS / RESOLVED)
 *   - Escalations by reason and channel
 *   - Avg resolution time (ms)
 *   - Rolling 24h and 7d escalation volume
 *
 * Auth: same HERMES_CHANNEL_SECRET header used by the Channel Mesh.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  // Auth
  const channelSecret = req.headers.get('x-hermes-channel-secret');
  const expectedSecret = process.env.HERMES_CHANNEL_SECRET;
  if (expectedSecret && channelSecret !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const { tenantId } = await params;
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // ─────────────── Conversation status breakdown ───────────────
    const convStatusRows = await db
      .select({
        status: hermesConversations.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(hermesConversations)
      .where(eq(hermesConversations.organizationId, tenantId))
      .groupBy(hermesConversations.status);

    const convStats = convStatusRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r.count;
      return acc;
    }, {});

    // ─────────────── Escalation funnel ───────────────
    const escalationStatusRows = await db
      .select({
        status: hermesEscalations.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(hermesEscalations)
      .where(eq(hermesEscalations.organizationId, tenantId))
      .groupBy(hermesEscalations.status);

    const escalationFunnel = escalationStatusRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r.count;
      return acc;
    }, {});

    // ─────────────── Escalation by reason ───────────────
    const byReasonRows = await db
      .select({
        reason: hermesEscalations.reason,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(hermesEscalations)
      .where(eq(hermesEscalations.organizationId, tenantId))
      .groupBy(hermesEscalations.reason);

    const byReason = byReasonRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.reason] = r.count;
      return acc;
    }, {});

    // ─────────────── Escalation by channel ───────────────
    const byChannelRows = await db
      .select({
        channel: hermesEscalations.channel,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(hermesEscalations)
      .where(eq(hermesEscalations.organizationId, tenantId))
      .groupBy(hermesEscalations.channel);

    const byChannel = byChannelRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.channel] = r.count;
      return acc;
    }, {});

    // ─────────────── Average resolution time ───────────────
    const [avgResRow] = await db
      .select({
        avgMs: sql<number>`
          cast(
            avg(
              extract(epoch from (${hermesEscalations.resolvedAt} - ${hermesEscalations.createdAt})) * 1000
            ) as integer
          )
        `,
      })
      .from(hermesEscalations)
      .where(
        and(
          eq(hermesEscalations.organizationId, tenantId),
          eq(hermesEscalations.status, 'RESOLVED'),
          sql`${hermesEscalations.resolvedAt} is not null`,
        ),
      );

    // ─────────────── Rolling volume ───────────────
    const [vol24h] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(hermesEscalations)
      .where(
        and(
          eq(hermesEscalations.organizationId, tenantId),
          gte(hermesEscalations.createdAt, since24h),
        ),
      );

    const [vol7d] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(hermesEscalations)
      .where(
        and(
          eq(hermesEscalations.organizationId, tenantId),
          gte(hermesEscalations.createdAt, since7d),
        ),
      );

    // ─────────────── Health derivation ───────────────
    const pending = escalationFunnel['PENDING'] ?? 0;
    const inProgress = escalationFunnel['IN_PROGRESS'] ?? 0;
    const openQueue = pending + inProgress;

    const health: 'GREEN' | 'YELLOW' | 'RED' =
      openQueue === 0 ? 'GREEN' : openQueue <= 5 ? 'YELLOW' : 'RED';

    return NextResponse.json({
      success: true,
      tenantId,
      generatedAt: now.toISOString(),
      health,
      conversations: {
        active: convStats['ACTIVE'] ?? 0,
        pausedHuman: convStats['PAUSED_HUMAN'] ?? 0,
        resolved: convStats['RESOLVED'] ?? 0,
        total: Object.values(convStats).reduce((s, n) => s + n, 0),
      },
      escalations: {
        funnel: {
          pending: escalationFunnel['PENDING'] ?? 0,
          inProgress: escalationFunnel['IN_PROGRESS'] ?? 0,
          resolved: escalationFunnel['RESOLVED'] ?? 0,
        },
        openQueue,
        byReason,
        byChannel,
        avgResolutionMs: avgResRow?.avgMs ?? null,
        volume: {
          last24h: vol24h?.count ?? 0,
          last7d: vol7d?.count ?? 0,
        },
      },
    });
  } catch (err: any) {
    console.error('[Observability] Error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'OBSERVABILITY_ERROR', detail: err?.message },
      { status: 500 },
    );
  }
}
