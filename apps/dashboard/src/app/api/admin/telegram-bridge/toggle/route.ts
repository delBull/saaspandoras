/**
 * POST /api/admin/telegram-bridge/toggle
 *
 * Toggle Telegram Bridge feature flags at runtime.
 * Persists overrides to platform_settings (survive restarts).
 *
 * Supported flags:
 *   gamification | claims | protocolReadonly | mintFreeArtifact | paranoiaMode
 *
 * Destructive toggles (disabling) require confirmationToken = 'CONFIRM'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { platformSettings } from '@/db/schema';

export const dynamic = 'force-dynamic';

const DESTRUCTIVE_FLAGS = ['gamification', 'claims', 'paranoiaMode'];

const FLAG_MAP: Record<string, { settingKey: string; label: string; envKey: string }> = {
    gamification: {
        settingKey: 'telegram_gamification_enabled',
        label: 'Telegram Gamification',
        envKey: 'ALLOW_TELEGRAM_GAMIFICATION',
    },
    claims: {
        settingKey: 'telegram_claims_enabled',
        label: 'PBOX Claims',
        envKey: 'PBOX_CLAIM_ENABLED',
    },
    protocolReadonly: {
        settingKey: 'telegram_protocol_readonly',
        label: 'Protocol Read-Only Access',
        envKey: 'TELEGRAM_ENABLE_PROTOCOL_READONLY',
    },
    mintFreeArtifact: {
        settingKey: 'telegram_mint_free_artifact',
        label: 'Free Artifact Minting',
        envKey: 'TELEGRAM_ENABLE_MINT_FREE_ARTIFACT',
    },
    paranoiaMode: {
        settingKey: 'telegram_paranoia_mode',
        label: 'Paranoia Mode',
        envKey: 'TELEGRAM_BRIDGE_PARANOIA_MODE',
    },
};

export async function POST(req: NextRequest) {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { flag, enabled, confirmationToken } = await req.json();

        if (!flag || !FLAG_MAP[flag]) {
            return NextResponse.json({ error: `Unknown flag: ${flag}` }, { status: 400 });
        }

        // Destructive toggles (disabling or enabling paranoia) require CONFIRM
        if (DESTRUCTIVE_FLAGS.includes(flag) && !enabled) {
            if (confirmationToken !== 'CONFIRM') {
                return NextResponse.json(
                    { error: 'Type CONFIRM to disable this feature' },
                    { status: 400 }
                );
            }
        }
        // Enabling Paranoia Mode also requires CONFIRM (it's restrictive and notable)
        if (flag === 'paranoiaMode' && enabled && confirmationToken !== 'CONFIRM') {
            return NextResponse.json(
                { error: 'Type CONFIRM to activate Paranoia Mode' },
                { status: 400 }
            );
        }

        const { settingKey, label } = FLAG_MAP[flag];

        await db
            .insert(platformSettings)
            .values({ key: settingKey, value: enabled ? 'true' : 'false', updatedAt: new Date() })
            .onConflictDoUpdate({
                target: platformSettings.key,
                set: { value: enabled ? 'true' : 'false', updatedAt: new Date() },
            });

        console.log(`[TelegramBridge Admin] ${label} → ${enabled ? 'ON' : 'OFF'} by ${session.address}`);

        const warningMessages: Record<string, string> = {
            gamification: 'All event recording stopped. No points or PBOX will be earned until re-enabled.',
            claims: 'Claim proofs will be rejected (403) until re-enabled. Existing reservations are safe.',
            paranoiaMode: enabled
                ? 'Paranoia Mode ACTIVE — rate limits tightened, economy read-only, forensic webhooks enabled.'
                : 'Paranoia Mode deactivated. Normal operations resumed.',
        };

        return NextResponse.json({
            ok: true,
            flag,
            enabled,
            message: `${label} ${enabled ? 'enabled' : 'disabled'}.`,
            warning: !enabled || flag === 'paranoiaMode' ? warningMessages[flag] : undefined,
        });
    } catch (err: any) {
        console.error('[Telegram Bridge Toggle]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
