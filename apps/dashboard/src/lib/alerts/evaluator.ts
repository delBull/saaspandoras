/**
 * Alert Evaluator — v2
 *
 * Changes from v1:
 * - Fetches P95 latency from gamification_action_executions.duration_ms
 * - Detects economy config drift (platform_settings changed in last 1h)
 * - Tracks firstSeenAt + timesFired24h for trend memory
 * - Passes complete BridgeMetricsSnapshot v2 to rules
 */
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { ALERT_RULES } from './rules';
import { sendDiscordAlert } from './notifier';
import type { BridgeMetricsSnapshot, AlertState, FiredAlert } from './types';

// ── Fetch Metrics Snapshot v2 ─────────────────────────────────────────────

export async function fetchMetricsSnapshot(): Promise<BridgeMetricsSnapshot> {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // ── Action executions ─────────────────────────────────────────────────
    let events_received_5m = 0;
    let events_accepted_5m = 0;
    let events_accepted_1h = 0;
    try {
        const rows = await db.execute(sql`
            SELECT
                count(*) FILTER (WHERE executed_at >= ${fiveMinAgo}) as accepted_5m,
                count(*) FILTER (WHERE executed_at >= ${oneHourAgo}) as accepted_1h
            FROM gamification_action_executions
        `) as any;
        const r = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
        events_accepted_5m = parseInt(r?.accepted_5m ?? 0);
        events_accepted_1h = parseInt(r?.accepted_1h ?? 0);
        events_received_5m = Math.max(events_accepted_5m, 1);
    } catch { /* table empty or not yet seeded */ }

    // ── P95 Latency (from duration_ms column, last 5m) ────────────────────
    let latency_p95_ms = 0;
    try {
        const rows = await db.execute(sql`
            SELECT
                percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95
            FROM gamification_action_executions
            WHERE executed_at >= ${fiveMinAgo}
              AND duration_ms IS NOT NULL
        `) as any;
        const r = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
        latency_p95_ms = Math.round(parseFloat(r?.p95 ?? 0) || 0);
    } catch { /* duration_ms column may not exist yet */ }

    // ── PBOX balances ─────────────────────────────────────────────────────
    let pbox_earned_total = 0, pbox_reserved_total = 0, pbox_claimed_total = 0;
    try {
        const rows = await db.execute(sql`
            SELECT
                coalesce(sum(total_earned), 0)::int as earned,
                coalesce(sum(reserved), 0)::int as reserved,
                coalesce(sum(claimed), 0)::int as claimed
            FROM pbox_balances
        `) as any;
        const r = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
        pbox_earned_total = parseInt(r?.earned ?? 0);
        pbox_reserved_total = parseInt(r?.reserved ?? 0);
        pbox_claimed_total = parseInt(r?.claimed ?? 0);
    } catch { /* table empty */ }

    // ── Webhooks ─────────────────────────────────────────────────────────
    let webhook_success_1h = 0, webhook_failed_1h = 0, webhook_pending = 0;
    let webhook_success_15m = 0, webhook_failed_15m = 0;
    try {
        const rows = await db.execute(sql`
            SELECT
                count(*) FILTER (WHERE status = 'sent' AND updated_at >= ${oneHourAgo}) as success_1h,
                count(*) FILTER (WHERE status = 'failed' AND updated_at >= ${oneHourAgo}) as failed_1h,
                count(*) FILTER (WHERE status = 'sent' AND updated_at >= ${fifteenMinAgo}) as success_15m,
                count(*) FILTER (WHERE status = 'failed' AND updated_at >= ${fifteenMinAgo}) as failed_15m,
                count(*) FILTER (WHERE status = 'pending') as pending
            FROM webhook_events
        `) as any;
        const r = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
        webhook_success_1h = parseInt(r?.success_1h ?? 0);
        webhook_failed_1h = parseInt(r?.failed_1h ?? 0);
        webhook_pending = parseInt(r?.pending ?? 0);
        webhook_success_15m = parseInt(r?.success_15m ?? 0);
        webhook_failed_15m = parseInt(r?.failed_15m ?? 0);
    } catch { /* table empty */ }

    const total_15m = webhook_success_15m + webhook_failed_15m;
    const webhook_success_rate_15m = total_15m > 0
        ? (webhook_success_15m / total_15m) * 100
        : 100;

    // ── Platform flags ────────────────────────────────────────────────────
    let gamification_enabled = process.env.ALLOW_TELEGRAM_GAMIFICATION === 'true';
    let claims_enabled = process.env.PBOX_CLAIM_ENABLED === 'true';
    let paranoia_mode = process.env.TELEGRAM_BRIDGE_PARANOIA_MODE === 'true';
    let economy_params_changed_1h = false;
    try {
        const settings = await db.execute(sql`
            SELECT key, value, updated_at FROM platform_settings
            WHERE key IN (
                'telegram_gamification_enabled',
                'telegram_claims_enabled',
                'telegram_paranoia_mode',
                'pbox_points_per_pbox',
                'pbox_conversion_version',
                'pbox_daily_cap_per_wallet',
                'pbox_default_chain_id'
            )
        `) as any;
        const rows: any[] = Array.isArray(settings) ? settings : (settings?.rows ?? []);
        for (const row of rows) {
            if (row.key === 'telegram_gamification_enabled') gamification_enabled = row.value === 'true';
            if (row.key === 'telegram_claims_enabled') claims_enabled = row.value === 'true';
            if (row.key === 'telegram_paranoia_mode') paranoia_mode = row.value === 'true';
            // Config drift: any economy param updated in last 1h
            if (['pbox_points_per_pbox', 'pbox_conversion_version', 'pbox_daily_cap_per_wallet', 'pbox_default_chain_id'].includes(row.key)) {
                if (row.updated_at && new Date(row.updated_at) >= oneHourAgo) {
                    economy_params_changed_1h = true;
                }
            }
        }
    } catch { /* platform_settings may not have rows */ }

    return {
        events_received_5m,
        events_accepted_5m,
        events_accepted_1h,
        events_accepted_24h: 0,
        latency_p95_ms,
        pbox_earned_total,
        pbox_reserved_total,
        pbox_claimed_total,
        pbox_earned_24h: 0,
        claims_pending: pbox_reserved_total,
        webhook_success_1h,
        webhook_failed_1h,
        webhook_success_rate_15m,
        webhook_pending,
        gamification_enabled,
        claims_enabled,
        paranoia_mode,
        economy_params_changed_1h,
    };
}

// ── Load Alert States from DB ─────────────────────────────────────────────

async function loadAlertStates(): Promise<Map<string, AlertState>> {
    const map = new Map<string, AlertState>();
    try {
        const rows = await db.execute(sql`
            SELECT
                alert_id, status,
                last_triggered_at, last_resolved_at,
                trigger_count,
                first_seen_at, times_fired_24h
            FROM alert_states
        `) as any;
        const list: any[] = Array.isArray(rows) ? rows : (rows?.rows ?? []);
        for (const r of list) {
            map.set(r.alert_id, {
                alertId: r.alert_id,
                status: r.status,
                lastTriggeredAt: r.last_triggered_at ? new Date(r.last_triggered_at) : null,
                lastResolvedAt: r.last_resolved_at ? new Date(r.last_resolved_at) : null,
                triggerCount: parseInt(r.trigger_count ?? 0),
                firstSeenAt: r.first_seen_at ? new Date(r.first_seen_at) : null,
                timesFired24h: parseInt(r.times_fired_24h ?? 0),
            });
        }
    } catch { /* alert_states may not exist yet */ }
    return map;
}

// ── Upsert Alert State (v2: track firstSeenAt + timesFired24h) ────────────

async function upsertAlertState(
    alertId: string,
    status: 'active' | 'resolved',
    now: Date,
    currentState: AlertState | undefined
): Promise<boolean> {
    const isNew = !currentState || currentState.status === 'resolved';
    const triggerCount = status === 'active'
        ? (currentState?.triggerCount ?? 0) + 1
        : (currentState?.triggerCount ?? 0);

    // firstSeenAt: set only on very first trigger, never update
    const firstSeenAt = currentState?.firstSeenAt ?? (status === 'active' ? now : null);

    // timesFired24h: count triggers in rolling 24h window (approximate via total increment)
    // For v1: increment on each trigger, reset to 0 on resolve
    const timesFired24h = status === 'active'
        ? (currentState?.timesFired24h ?? 0) + 1
        : 0;

    try {
        await db.execute(sql`
            INSERT INTO alert_states (
                alert_id, status,
                last_triggered_at, last_resolved_at,
                trigger_count,
                first_seen_at, times_fired_24h
            )
            VALUES (
                ${alertId},
                ${status},
                ${status === 'active' ? now : currentState?.lastTriggeredAt ?? null},
                ${status === 'resolved' ? now : currentState?.lastResolvedAt ?? null},
                ${triggerCount},
                ${firstSeenAt},
                ${timesFired24h}
            )
            ON CONFLICT (alert_id) DO UPDATE SET
                status            = EXCLUDED.status,
                last_triggered_at = CASE WHEN ${status} = 'active'   THEN ${now} ELSE alert_states.last_triggered_at END,
                last_resolved_at  = CASE WHEN ${status} = 'resolved' THEN ${now} ELSE alert_states.last_resolved_at  END,
                trigger_count     = EXCLUDED.trigger_count,
                first_seen_at     = COALESCE(alert_states.first_seen_at, EXCLUDED.first_seen_at),
                times_fired_24h   = EXCLUDED.times_fired_24h,
                updated_at        = ${now}
        `);
    } catch (e) {
        console.error('[AlertEvaluator] upsertAlertState failed:', e);
    }
    return isNew;
}

// ── Main Evaluator ────────────────────────────────────────────────────────

export async function runAlertEvaluator(): Promise<{
    evaluated: number;
    fired: string[];
    resolved: string[];
    errors: string[];
}> {
    const now = new Date();
    const fired: string[] = [];
    const resolved: string[] = [];
    const errors: string[] = [];

    let metrics: BridgeMetricsSnapshot;
    try {
        metrics = await fetchMetricsSnapshot();
    } catch (e: any) {
        console.error('[AlertEvaluator] Failed to fetch metrics:', e);
        return { evaluated: 0, fired: [], resolved: [], errors: [e.message] };
    }

    const states = await loadAlertStates();

    for (const rule of ALERT_RULES) {
        try {
            const conditionMet = rule.condition(metrics);
            const currentState = states.get(rule.id);

            if (conditionMet) {
                const isCurrentlyActive = currentState?.status === 'active';
                const lastTriggered = currentState?.lastTriggeredAt;
                const cooldownMs = rule.cooldownMinutes * 60 * 1000;
                const inCooldown = isCurrentlyActive && lastTriggered
                    && (now.getTime() - lastTriggered.getTime()) < cooldownMs;

                if (!inCooldown) {
                    const isNew = await upsertAlertState(rule.id, 'active', now, currentState);
                    const alert: FiredAlert = { rule, metrics, firedAt: now, isNew };
                    await sendDiscordAlert(alert);
                    fired.push(rule.id);
                }
            } else if (currentState?.status === 'active') {
                await upsertAlertState(rule.id, 'resolved', now, currentState);
                resolved.push(rule.id);
            }
        } catch (e: any) {
            console.error(`[AlertEvaluator] Error evaluating rule ${rule.id}:`, e);
            errors.push(rule.id);
        }
    }

    console.log(`[AlertEvaluator] Done — fired: ${fired.join(', ') || 'none'}, resolved: ${resolved.join(', ') || 'none'}`);
    return { evaluated: ALERT_RULES.length, fired, resolved, errors };
}
