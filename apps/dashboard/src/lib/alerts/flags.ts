import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * Shared runtime flags for Telegram Bridge.
 * Combines process.env defaults with platform_settings overrides.
 */
export async function getBridgeFlags() {
    // 1. Env defaults
    const flags = {
        gamificationEnabled: process.env.ALLOW_TELEGRAM_GAMIFICATION === 'true',
        claimsEnabled: process.env.PBOX_CLAIM_ENABLED === 'true',
        paranoiaMode: process.env.TELEGRAM_BRIDGE_PARANOIA_MODE === 'true',
    };

    // 2. DB overrides (survive redeploys, managed via Admin Panel)
    try {
        const rows = await db.execute(sql`
            SELECT key, value FROM platform_settings
            WHERE key IN (
                'telegram_gamification_enabled',
                'telegram_claims_enabled',
                'telegram_paranoia_mode'
            )
        `) as any;

        const list: any[] = Array.isArray(rows) ? rows : (rows?.rows ?? []);

        for (const row of list) {
            if (row.key === 'telegram_gamification_enabled') flags.gamificationEnabled = row.value === 'true';
            if (row.key === 'telegram_claims_enabled') flags.claimsEnabled = row.value === 'true';
            if (row.key === 'telegram_paranoia_mode') flags.paranoiaMode = row.value === 'true';
        }
    } catch {
        // Fallback to env if table or rows missing
    }

    return flags;
}
