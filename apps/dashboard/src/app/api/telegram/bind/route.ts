/**
 * POST /api/telegram/bind
 *
 * Links a Telegram user ID to a wallet address.
 * Called by Telegram App during onboarding (after user connects wallet).
 *
 * ✅ Bot CAN: register identity binding
 * ❌ Bot CANNOT: create protocols, change artifacts, trigger mutations
 *
 * Security: No strong auth — Telegram IDs are weak identifiers.
 * This endpoint is for UX identity, not for authorization.
 * All sensitive operations require wallet signature verification separately.
 */
import { db } from '@/db';
import { telegramBindings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { telegramUserId, walletAddress } = await req.json();

        if (!telegramUserId || !walletAddress) {
            return Response.json({ error: 'Missing telegramUserId or walletAddress' }, { status: 400 });
        }

        const wallet = String(walletAddress).toLowerCase().trim();

        // Basic address sanity check
        if (!wallet.startsWith('0x') || wallet.length !== 42) {
            return Response.json({ error: 'Invalid walletAddress format' }, { status: 400 });
        }

        // Upsert — safe to call multiple times (e.g. re-login)
        await db
            .insert(telegramBindings)
            .values({
                telegramUserId: String(telegramUserId),
                walletAddress: wallet,
                source: 'telegram',
                lastSeenAt: new Date(),
            })
            .onConflictDoUpdate({
                target: telegramBindings.telegramUserId,
                set: {
                    walletAddress: wallet,
                    lastSeenAt: new Date(),
                },
            });

        return Response.json({ ok: true });
    } catch (err) {
        console.error('[/api/telegram/bind] Error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
