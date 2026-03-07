/**
 * GET  /api/admin/telegram-bridge/economy  — read current economy params
 * POST /api/admin/telegram-bridge/economy  — update economy params
 *
 * Economy params are stored in platform_settings and override env vars.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { platformSettings } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const ECONOMY_KEYS = [
    'pbox_points_per_pbox',
    'pbox_conversion_version',
    'pbox_daily_cap_per_wallet',
    'pbox_default_chain_id',
];

function readEnvDefaults() {
    return {
        pointsPerPbox: parseInt(process.env.POINTS_PER_PBOX || '10'),
        conversionVersion: parseInt(process.env.PBOX_CONVERSION_VERSION || '1'),
        dailyCapPerWallet: parseInt(process.env.PBOX_DAILY_CAP_PER_WALLET || '0'), // 0 = unlimited
        defaultChainId: parseInt(process.env.PBOX_DEFAULT_CHAIN_ID || '137'),
    };
}

export async function GET() {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rows = await db
            .select()
            .from(platformSettings)
            .where(inArray(platformSettings.key, ECONOMY_KEYS));

        const overrides: Record<string, string> = {};
        for (const r of rows) overrides[r.key] = r.value ?? '';

        const defaults = readEnvDefaults();

        return NextResponse.json({
            pointsPerPbox: parseInt(overrides.pbox_points_per_pbox || String(defaults.pointsPerPbox)),
            conversionVersion: parseInt(overrides.pbox_conversion_version || String(defaults.conversionVersion)),
            dailyCapPerWallet: parseInt(overrides.pbox_daily_cap_per_wallet || String(defaults.dailyCapPerWallet)),
            defaultChainId: parseInt(overrides.pbox_default_chain_id || String(defaults.defaultChainId)),
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { pointsPerPbox, conversionVersion, dailyCapPerWallet, defaultChainId } = body;

        // Validate
        if (pointsPerPbox !== undefined && (isNaN(pointsPerPbox) || pointsPerPbox < 1)) {
            return NextResponse.json({ error: 'pointsPerPbox must be >= 1' }, { status: 400 });
        }
        if (dailyCapPerWallet !== undefined && (isNaN(dailyCapPerWallet) || dailyCapPerWallet < 0)) {
            return NextResponse.json({ error: 'dailyCapPerWallet must be >= 0' }, { status: 400 });
        }

        const updates: { key: string; value: string }[] = [];
        if (pointsPerPbox !== undefined) updates.push({ key: 'pbox_points_per_pbox', value: String(pointsPerPbox) });
        if (conversionVersion !== undefined) updates.push({ key: 'pbox_conversion_version', value: String(conversionVersion) });
        if (dailyCapPerWallet !== undefined) updates.push({ key: 'pbox_daily_cap_per_wallet', value: String(dailyCapPerWallet) });
        if (defaultChainId !== undefined) updates.push({ key: 'pbox_default_chain_id', value: String(defaultChainId) });

        for (const { key, value } of updates) {
            await db
                .insert(platformSettings)
                .values({ key, value, updatedAt: new Date() })
                .onConflictDoUpdate({
                    target: platformSettings.key,
                    set: { value, updatedAt: new Date() },
                });
        }

        console.log(`[TelegramBridge Economy] Updated by ${session.address}:`, updates);

        return NextResponse.json({ ok: true, updated: updates.map(u => u.key) });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
