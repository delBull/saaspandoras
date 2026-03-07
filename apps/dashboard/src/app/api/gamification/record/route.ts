/**
 * POST /api/gamification/record
 *
 * Records a gamification event coming from any external source (Telegram, Dashboard).
 * Uses GamificationService as the single entrypoint — no direct engine calls.
 *
 * ✅ Bot CAN: record telegram.claim, telegram.task_complete, telegram.referral
 * ❌ Bot CANNOT: trigger protocol_deployed, sale_certified, admin_action
 *
 * After recording, emits a gamification.event webhook to all registered edges.
 *
 * Request body:
 *   { walletAddress: string, eventType: string, metadata?: object }
 *
 * Optional header:
 *   X-Telegram-User-Id: telegramUserId (to include in webhook payload)
 */
import type { NextRequest } from 'next/server';
import { GamificationService } from '@pandoras/gamification/core/gamification-service';
import { db } from '@/db';
import { telegramBindings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { emitGamificationWebhook } from '@/lib/webhooks/emit';
import { getBridgeFlags } from '@/lib/alerts/flags';

// ── Soft rate-limiter (in-memory, per wallet+source) ─────────────────────────
// Purpose: catch buggy bots sending event storms, NOT a security measure.
// Replace with Redis-backed counter when traffic scales.
const RATE_LIMIT_MAX = 10;          // max events
const RATE_LIMIT_WINDOW_MS = 60_000; // per 60 seconds

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(walletAddress: string, source: string): boolean {
    const key = `${walletAddress}:${source}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(key, { count: 1, windowStart: now });
        return true; // within limit
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return false; // over limit
    }

    entry.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        const flags = await getBridgeFlags();

        // ── Feature flag gate ─────────────────────────────────────────────────
        if (!flags.gamificationEnabled) {
            return Response.json({ error: 'Gamification recording is disabled' }, { status: 403 });
        }

        // ── Paranoia Mode gate ────────────────────────────────────────────────
        if (flags.paranoiaMode) {
            return Response.json({
                error: 'Bridge is in PARANOIA MODE. Economy is read-only. No events recorded.'
            }, { status: 403 });
        }

        const { walletAddress, eventType, metadata } = await req.json();
        const telegramUserId = req.headers.get('x-telegram-user-id') ?? undefined;

        if (!walletAddress || !eventType) {
            return Response.json({ error: 'Missing walletAddress or eventType' }, { status: 400 });
        }

        // ── Rate-limit (soft): max 10 events / 60s per wallet+source ──────────
        if (!checkRateLimit(walletAddress, 'telegram')) {
            return Response.json(
                { error: 'Rate limit exceeded. Max 10 gamification events per minute per wallet.' },
                { status: 429 }
            );
        }

        // ── Verify Telegram wallet binding if telegramUserId provided ─────────
        if (telegramUserId) {
            const binding = await db
                .select()
                .from(telegramBindings)
                .where(eq(telegramBindings.telegramUserId, telegramUserId))
                .limit(1);

            if (binding.length === 0) {
                return Response.json(
                    { error: 'Telegram user not bound to a wallet. Call /api/telegram/bind first.' },
                    { status: 403 }
                );
            }

            // Ensure the claimed wallet matches the bound wallet
            const boundWallet = binding[0]?.walletAddress;
            if (boundWallet !== walletAddress.toLowerCase()) {
                return Response.json(
                    { error: 'walletAddress does not match bound Telegram wallet' },
                    { status: 403 }
                );
            }
        }

        // ── Record via GamificationService ────────────────────────────────────
        const service = GamificationService.getInstance();
        const result = await service.record({
            source: 'telegram',
            walletAddress,
            eventType,
            metadata: { ...metadata, telegramUserId },
        });

        // ── Emit gamification.event webhook ───────────────────────────────────
        await emitGamificationWebhook({
            walletAddress,
            telegramUserId,
            source: 'telegram',
            eventType,
            metadata,
            result,
        });

        return Response.json({
            ok: true,
            pointsEarned: result.pointsEarned,
            achievementsUnlocked: result.achievementsUnlocked,
            rewardsGranted: result.rewardsGranted,
            pboxDelta: result.pboxDelta,
            balances: result.balances,
        });
    } catch (err: any) {
        // Source policy violations are 403, not 500
        if (err?.message?.startsWith('[GamificationService]')) {
            return Response.json({ error: err.message }, { status: 403 });
        }
        console.error('[/api/gamification/record] Error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
