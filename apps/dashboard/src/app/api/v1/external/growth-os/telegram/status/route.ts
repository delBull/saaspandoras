import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookEvents } from '@/db/schema';
import { sql, gte, eq, and } from 'drizzle-orm';
import { validateExternalKey } from '@/lib/api-auth/validate-external-key';

export const dynamic = 'force-dynamic';

async function getFlags(): Promise<Record<string, boolean | number>> {
    const flags: Record<string, boolean | number> = {
        gamificationEnabled: process.env.ALLOW_TELEGRAM_GAMIFICATION === 'true',
        claimsEnabled: process.env.PBOX_CLAIM_ENABLED === 'true',
        protocolReadonly: process.env.TELEGRAM_ENABLE_PROTOCOL_READONLY !== 'false',
        mintFreeArtifact: process.env.TELEGRAM_ENABLE_MINT_FREE_ARTIFACT === 'true',
        mutationsAllowed: process.env.ALLOW_TELEGRAM_MUTATIONS === 'true',
        paranoiaMode: process.env.TELEGRAM_BRIDGE_PARANOIA_MODE === 'true',
        pointsPerPbox: parseInt(process.env.POINTS_PER_PBOX || '10'),
    };

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
        const rowData = ((rows as any).rows ?? rows) as any[];
        for (const row of rowData) {
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
    } catch { /* platform_settings might not exist or be empty */ }

    return flags;
}

/**
 * GET /api/v1/external/growth-os/telegram/status
 * 
 * Secure version of admin/telegram-bridge/status for external partners.
 * Returns health, feature flags and binding metrics.
 */
export async function GET(req: NextRequest) {
    const { client, error } = await validateExternalKey(req, "read:growth_os");
    if (error || !client) {
        return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 1. Feature Flags (Telegran Bridge Control)
        const flags = await getFlags();

        // 2. Binding Metrics
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
        } catch { }

        // 3. Performance & Volume (Golden Signals)
        let golden = { accepted_5m: 0, accepted_24h: 0, total: 0 };
        try {
            const rows = await db.execute(sql`
                SELECT
                    count(*) FILTER (WHERE executed_at >= ${fiveMinAgo}) as accepted_5m,
                    count(*) FILTER (WHERE executed_at >= ${oneDayAgo}) as accepted_24h,
                    count(*) as total
                FROM gamification_action_executions
            `) as any;
            const r = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
            golden = {
                accepted_5m: parseInt(r?.accepted_5m ?? 0),
                accepted_24h: parseInt(r?.accepted_24h ?? 0),
                total: parseInt(r?.total ?? 0),
            };
        } catch { }

        // 4. PBOX Economy stats
        let pboxStats = { totalEarned: 0, totalClaimed: 0, activeWallets: 0 };
        try {
            const rows = await db.execute(sql`
                SELECT
                    count(*) as "activeWallets",
                    coalesce(sum(total_earned), 0) as "totalEarned",
                    coalesce(sum(claimed), 0) as "totalClaimed"
                FROM pbox_balances
            `) as any;
            const r = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
            pboxStats = {
                activeWallets: parseInt(r?.activeWallets ?? 0),
                totalEarned: parseInt(r?.totalEarned ?? 0),
                totalClaimed: parseInt(r?.totalClaimed ?? 0),
            };
        } catch { }

        return NextResponse.json({
            success: true,
            project: client.name,
            timestamp: now.toISOString(),
            bridge: {
                flags,
                metrics: {
                    totalUsers: bindingTotal,
                    newUsers24h: bindingRecent,
                    totalActions: golden.total,
                    actionsLast24h: golden.accepted_24h,
                    actionsLast5m: golden.accepted_5m,
                }
            },
            economy: {
                totalPboxEmitted: pboxStats.totalEarned,
                totalPboxClaimed: pboxStats.totalClaimed,
                activeInvestors: pboxStats.activeWallets
            }
        });

    } catch (e: any) {
        console.error("[external:telegram:status] Error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
