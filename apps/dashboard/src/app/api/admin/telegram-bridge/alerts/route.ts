/**
 * GET /api/admin/telegram-bridge/alerts
 *
 * Returns current alert states for the Admin UI:
 * - active alerts (with rule metadata)
 * - recent alert history (last 24h)
 */
import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { ALERT_RULES } from '@/lib/alerts/rules';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let rows: any[] = [];
        try {
            const result = await db.execute(sql`
                SELECT
                    alert_id,
                    status,
                    last_triggered_at,
                    last_resolved_at,
                    trigger_count,
                    first_seen_at,
                    times_fired_24h,
                    updated_at
                FROM alert_states
                ORDER BY
                    CASE status WHEN 'active' THEN 0 ELSE 1 END,
                    last_triggered_at DESC NULLS LAST
            `) as any;
            rows = Array.isArray(result) ? result : (result?.rows ?? []);
        } catch {
            // alert_states table doesn't exist yet — return empty
        }

        // Enrich with rule metadata
        const ruleMap = Object.fromEntries(ALERT_RULES.map(r => [r.id, r]));

        const alerts = rows.map((r: any) => {
            const rule = ruleMap[r.alert_id];
            return {
                alertId: r.alert_id,
                status: r.status,
                severity: rule?.severity ?? 'info',
                title: rule?.title ?? r.alert_id,
                emoji: rule?.emoji ?? '🔔',
                suggestedAction: rule?.suggestedAction ?? null,
                playbook: rule?.playbook ?? null,
                cooldownMinutes: rule?.cooldownMinutes ?? 0,
                lastTriggeredAt: r.last_triggered_at,
                lastResolvedAt: r.last_resolved_at,
                triggerCount: parseInt(r.trigger_count ?? 0),
                firstSeenAt: r.first_seen_at ?? null,
                timesFired24h: parseInt(r.times_fired_24h ?? 0),
                updatedAt: r.updated_at,
            };
        });

        const active = alerts.filter(a => a.status === 'active');
        const resolved = alerts.filter(a => a.status === 'resolved');

        return NextResponse.json({
            active,
            resolved,
            total: alerts.length,
            activeCount: active.length,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
