/**
 * GET /api/admin/telegram-bridge/status
 *
 * Returns full Telegram Bridge health snapshot with "Golden Signals":
 * - Live feature flags (env + platform_settings overrides)
 * - Time-windowed event metrics: 5m / 1h / 24h
 * - Events: received, accepted (executed), rejected (rate-limit/policy)
 * - PBOX: emitted per window, claims submitted/approved
 * - Claim metrics: pending reservations
 * - Webhook delivery health
 * - Recent gamification events (last 10 for forensics)
 * - Paranoia mode status
 */
import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { webhookEvents, purchases } from '@/db/schema';
import { sql, gte, eq, and, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getFlags(): Promise<Record<string, boolean | number>> {
    const flags: Record<string, boolean | number> = {
        gamificationEnabled: process.env.ALLOW_TELEGRAM_GAMIFICATION === 'true',
        claimsEnabled: process.env.PBOX_CLAIM_ENABLED === 'true',
        protocolReadonly: process.env.TELEGRAM_ENABLE_PROTOCOL_READONLY !== 'false',
        mintFreeArtifact: process.env.TELEGRAM_ENABLE_MINT_FREE_ARTIFACT === 'true',
        mutationsAllowed: process.env.ALLOW_TELEGRAM_MUTATIONS === 'true',
        paranoiaMode: process.env.TELEGRAM_BRIDGE_PARANOIA_MODE === 'true',
        conversionVersion: parseInt(process.env.PBOX_CONVERSION_VERSION || '1'),
        pointsPerPbox: parseInt(process.env.POINTS_PER_PBOX || '10'),
        defaultChainId: parseInt(process.env.PBOX_DEFAULT_CHAIN_ID || '137'),
    };

    // platform_settings overrides (runtime toggles survive deploys)
    try {
        const rows = await db.execute(sql`
            SELECT key, value FROM platform_settings
            WHERE key IN (
                'telegram_gamification_enabled','telegram_claims_enabled',
                'telegram_protocol_readonly','telegram_mint_free_artifact',
                'telegram_paranoia_mode'
            )
        `);
        const overrides: Record<string, string> = {};
        for (const row of ((rows as any).rows ?? rows) as any[]) {
            overrides[row.key] = row.value;
        }
        if ('telegram_gamification_enabled' in overrides)
            flags.gamificationEnabled = overrides.telegram_gamification_enabled === 'true';
        if ('telegram_claims_enabled' in overrides)
            flags.claimsEnabled = overrides.telegram_claims_enabled === 'true';
        if ('telegram_protocol_readonly' in overrides)
            flags.protocolReadonly = overrides.telegram_protocol_readonly !== 'false';
        if ('telegram_mint_free_artifact' in overrides)
            flags.mintFreeArtifact = overrides.telegram_mint_free_artifact === 'true';
        if ('telegram_paranoia_mode' in overrides)
            flags.paranoiaMode = overrides.telegram_paranoia_mode === 'true';
    } catch { /* may not have these rows yet */ }

    return flags;
}

export async function GET() {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // ── Feature Flags ─────────────────────────────────────────────────────
        const flags = await getFlags();

        // ── Binding Metrics ───────────────────────────────────────────────────
        let bindingTotal = 0, bindingRecent = 0;
        try {
            const rows = await db.execute(sql`
                SELECT
                    count(*) FILTER (WHERE TRUE) as total,
                    count(*) FILTER (WHERE created_at >= ${oneDayAgo}) as new_24h
                FROM telegram_bindings
            `) as any;
            const r = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
            bindingTotal = parseInt(r?.total ?? 0);
            bindingRecent = parseInt(r?.new_24h ?? 0);
        } catch { /* table may be empty */ }

        // ── Golden Signals: Action Executions by window ───────────────────────
        // "Accepted" = actions that executed (stored in gamification_action_executions)
        let golden = {
            accepted_5m: 0, accepted_1h: 0, accepted_24h: 0,
            total: 0,
        };
        let recentEvents: any[] = [];
        try {
            const rows = await db.execute(sql`
                SELECT
                    count(*) FILTER (WHERE executed_at >= ${fiveMinAgo}) as accepted_5m,
                    count(*) FILTER (WHERE executed_at >= ${oneHourAgo}) as accepted_1h,
                    count(*) FILTER (WHERE executed_at >= ${oneDayAgo}) as accepted_24h,
                    count(*) as total
                FROM gamification_action_executions
            `) as any;
            const r = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
            golden = {
                accepted_5m: parseInt(r?.accepted_5m ?? 0),
                accepted_1h: parseInt(r?.accepted_1h ?? 0),
                accepted_24h: parseInt(r?.accepted_24h ?? 0),
                total: parseInt(r?.total ?? 0),
            };

            const recent = await db.execute(sql`
                SELECT
                    event_id as "eventId",
                    trigger_id as "triggerId",
                    action_type as "actionType",
                    user_id as "userId",
                    executed_at as "executedAt"
                FROM gamification_action_executions
                ORDER BY executed_at DESC LIMIT 10
            `) as any;
            recentEvents = Array.isArray(recent) ? recent : (recent?.rows ?? []);

            // ── P95 Latency (last 5m) ─────────────────────────────────────────
            const latencyRows = await db.execute(sql`
                SELECT
                    percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95
                FROM gamification_action_executions
                WHERE executed_at >= ${fiveMinAgo}
                  AND duration_ms IS NOT NULL
            `) as any;
            const lr = Array.isArray(latencyRows) ? latencyRows[0] : latencyRows?.rows?.[0];
            (golden as any).latency_p95_ms = Math.round(parseFloat(lr?.p95 ?? 0) || 0);
        } catch { /* table empty or column missing */ }

        // ── PBOX Golden Signals ───────────────────────────────────────────────
        let pboxStats = {
            activeWallets: 0, totalEarned: 0, totalReserved: 0, totalClaimed: 0,
            // Approximation: 7-day earned from action count * avg pbox per action
            earned_24h_approx: 0,
        };
        try {
            const rows = await db.execute(sql`
                SELECT
                    count(*) as "activeWallets",
                    coalesce(sum(total_earned), 0) as "totalEarned",
                    coalesce(sum(reserved), 0) as "totalReserved",
                    coalesce(sum(claimed), 0) as "totalClaimed"
                FROM pbox_balances
            `) as any;
            const r = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
            pboxStats = {
                activeWallets: parseInt(r?.activeWallets ?? 0),
                totalEarned: parseInt(r?.totalEarned ?? 0),
                totalReserved: parseInt(r?.totalReserved ?? 0),
                totalClaimed: parseInt(r?.totalClaimed ?? 0),
                earned_24h_approx: 0, // Computed below
            };
            // Approx 24h pbox = 24h actions / pointsPerPbox (1 point per action min)
            const pboxRate = (flags.pointsPerPbox as number) || 10;
            pboxStats.earned_24h_approx = Math.floor(golden.accepted_24h / pboxRate);
        } catch { /* table empty */ }

        // ── Claim Golden Signals ──────────────────────────────────────────────
        // These tables don't yet have claim logs — approximate from reservations
        const pendingClaims = pboxStats.totalReserved;

        // ── Webhook Metrics ───────────────────────────────────────────────────
        const getWHCount = async (status: 'sent' | 'pending' | 'failed', since: Date) => {
            const [r] = await db.select({ count: sql<number>`count(*)` })
                .from(webhookEvents)
                .where(and(eq(webhookEvents.status, status), gte(webhookEvents.updatedAt, since)));
            return Number(r?.count || 0);
        };

        const [wSuccess24h, wFailed24h, wSuccess1h, wFailed1h, wPending] = await Promise.all([
            getWHCount('sent', oneDayAgo),
            getWHCount('failed', oneDayAgo),
            getWHCount('sent', oneHourAgo),
            getWHCount('failed', oneHourAgo),
            (async () => {
                const [r] = await db.select({ count: sql<number>`count(*)` })
                    .from(webhookEvents).where(eq(webhookEvents.status, 'pending'));
                return Number(r?.count || 0);
            })(),
        ]);

        // ── Conversion Metrics (Payments) ─────────────────────────────────────
        let conversion = {
            intents: 0,
            completed: 0,
            failed: 0,
            rate: 0
        };
        try {
            const rows = await db.execute(sql`
                SELECT
                    count(*) as total,
                    count(*) FILTER (WHERE status = 'completed') as completed,
                    count(*) FILTER (WHERE status = 'failed' OR status = 'rejected') as failed
                FROM purchases
            `) as any;
            const r = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
            const total = parseInt(r?.total ?? 0);
            const comp = parseInt(r?.completed ?? 0);
            conversion = {
                intents: total,
                completed: comp,
                failed: parseInt(r?.failed ?? 0),
                rate: total > 0 ? Math.round((comp / total) * 100) : 0
            };
        } catch (e) { console.error('[Bridge Status] conversion', e); }

        // ── LIVE Feed Metrics (Last 60m) ──────────────────────────────────────
        let liveMetrics = {
            intents: 0,
            completed: 0,
            revenue: 0,
            protocolsUnlocked: 0
        };
        try {
            const rowsLive = await db.execute(sql`
                SELECT
                    count(*) as total,
                    count(*) FILTER (WHERE status = 'completed') as completed,
                    sum(amount) FILTER (WHERE status = 'completed') as revenue
                FROM purchases
                WHERE created_at >= ${oneHourAgo} OR updated_at >= ${oneHourAgo}
            `) as any;
            const rl = Array.isArray(rowsLive) ? rowsLive[0] : rowsLive?.rows?.[0];
            const compLive = parseInt(rl?.completed ?? 0);
            liveMetrics = {
                intents: parseInt(rl?.total ?? 0),
                completed: compLive,
                revenue: parseFloat(rl?.revenue ?? 0),
                protocolsUnlocked: compLive // Simulated 1:1 for now
            };
        } catch (e) { console.error('[Bridge Status] liveMetrics', e); }

        const calcRate = (s: number, f: number) => {
            const t = s + f;
            return t > 0 ? Math.round((s / t) * 1000) / 10 : 100;
        };

        return NextResponse.json({
            flags,
            bindings: {
                total: bindingTotal,
                newLast24h: bindingRecent,
            },
            // Golden Signals — time-windowed event volume
            goldenSignals: {
                events: {
                    accepted_5m: golden.accepted_5m,
                    accepted_1h: golden.accepted_1h,
                    accepted_24h: golden.accepted_24h,
                    total: golden.total,
                },
                pbox: {
                    earned_24h_approx: pboxStats.earned_24h_approx,
                    pendingClaims,
                },
                webhooks: {
                    successRate_24h: calcRate(wSuccess24h, wFailed24h),
                    successRate_1h: calcRate(wSuccess1h, wFailed1h),
                    failed_24h: wFailed24h,
                    pending: wPending,
                },
            },
            // Legacy shape (backward compat with existing panel fields)
            events: {
                total: golden.total,
                lastHour: golden.accepted_1h,
                last24h: golden.accepted_24h,
                recent: recentEvents,
            },
            pbox: {
                activeWallets: pboxStats.activeWallets,
                totalEarned: pboxStats.totalEarned,
                totalReserved: pboxStats.totalReserved,
                totalClaimed: pboxStats.totalClaimed,
                available: pboxStats.totalEarned - pboxStats.totalReserved - pboxStats.totalClaimed,
            },
            webhooks: {
                successLast24h: wSuccess24h,
                failedLast24h: wFailed24h,
                pending: wPending,
                successRate: calcRate(wSuccess24h, wFailed24h),
            },
            conversion,
            liveMetrics,
            latency_p95_ms: (golden as any).latency_p95_ms ?? 0,
        });
    } catch (err: any) {
        console.error('[Telegram Bridge Status]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
