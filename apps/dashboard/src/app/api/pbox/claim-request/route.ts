/**
 * POST /api/pbox/claim-request
 *
 * Generates a signed PBOX claim payload for the Telegram App.
 * The Telegram App uses this payload to execute the on-chain claim.
 *
 * Core responsibilities:
 * 1. Verify Telegram ↔ wallet binding exists
 * 2. Verify pbox_balances.available > 0
 * 3. Generate signed proof (HMAC: wallet+amount+nonce+chainId+expiresAt)
 * 4. Reserve the PBOX amount (mark as pending)
 *
 * ✅ Bot CAN: request a claim proof
 * ❌ Core does NOT mint tokens — that's done by the Telegram App on-chain
 *
 * The `chainId` is included in the signature to prevent cross-chain replay attacks.
 */
import { NextRequest } from 'next/server';
import { createHmac, randomBytes } from 'crypto';
import { db } from '@/db';
import { telegramBindings, pboxBalances } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { PBOXClaimPayload } from '@pandoras/gamification/types/bridge';
import { getBridgeFlags } from '@/lib/alerts/flags';

const CLAIM_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_CHAIN_ID = parseInt(process.env.PBOX_DEFAULT_CHAIN_ID ?? '137'); // Polygon mainnet

export async function POST(req: NextRequest) {
    try {
        const flags = await getBridgeFlags();

        // ── Feature flag gate ─────────────────────────────────────────────────
        if (!flags.claimsEnabled) {
            return Response.json({ error: 'PBOX claims are currently disabled' }, { status: 403 });
        }

        // ── Paranoia Mode gate ────────────────────────────────────────────────
        if (flags.paranoiaMode) {
            return Response.json({
                error: 'Bridge is in PARANOIA MODE. Economy is read-only. Claims blocked.'
            }, { status: 403 });
        }

        if (!process.env.PBOX_CLAIM_SIGNING_SECRET) {
            console.error('[/api/pbox/claim-request] PBOX_CLAIM_SIGNING_SECRET not set');
            return Response.json({ error: 'Claim service misconfigured' }, { status: 500 });
        }

        const { walletAddress, telegramUserId } = await req.json();

        if (!walletAddress || !telegramUserId) {
            return Response.json({ error: 'Missing walletAddress or telegramUserId' }, { status: 400 });
        }

        const wallet = String(walletAddress).toLowerCase().trim();

        // ── Verify Telegram ↔ wallet binding ─────────────────────────────────
        const binding = await db
            .select()
            .from(telegramBindings)
            .where(eq(telegramBindings.telegramUserId, String(telegramUserId)))
            .limit(1);

        if (binding.length === 0 || binding[0]?.walletAddress !== wallet) {
            return Response.json(
                { error: 'Telegram user not bound to this wallet' },
                { status: 403 }
            );
        }

        // ── Fetch PBOX balance ────────────────────────────────────────────────
        const balanceRows = await db
            .select()
            .from(pboxBalances)
            .where(eq(pboxBalances.walletAddress, wallet))
            .limit(1);

        const balance = balanceRows[0] ?? { totalEarned: 0, reserved: 0, claimed: 0 };
        const availablePbox = balance.totalEarned - balance.reserved - balance.claimed;

        if (availablePbox <= 0) {
            return Response.json({ error: 'No PBOX available to claim' }, { status: 400 });
        }

        // ── Build claim payload ───────────────────────────────────────────────
        const claimId = `claim_${randomBytes(12).toString('hex')}`;
        const nonce = randomBytes(16).toString('hex');
        const chainId = DEFAULT_CHAIN_ID;
        const expiresAt = Date.now() + CLAIM_TTL_MS;
        const amount = availablePbox;

        // Signature: HMAC-SHA256 of canonical payload
        // Format: wallet:amount:nonce:chainId:expiresAt
        const canonical = `${wallet}:${amount}:${nonce}:${chainId}:${expiresAt}`;
        const signature = createHmac('sha256', process.env.PBOX_CLAIM_SIGNING_SECRET!)
            .update(canonical)
            .digest('hex');

        // ── Reserve PBOX (mark as pending on-chain) ───────────────────────────
        await db
            .insert(pboxBalances)
            .values({
                walletAddress: wallet,
                totalEarned: 0,
                reserved: amount,
                claimed: 0,
            })
            .onConflictDoUpdate({
                target: pboxBalances.walletAddress,
                set: {
                    reserved: sql`${pboxBalances.reserved} + ${amount}`,
                    updatedAt: new Date(),
                },
            });

        const payload: PBOXClaimPayload = {
            claimId,
            walletAddress: wallet,
            amount,
            nonce,
            chainId,
            signature,
            expiresAt,
        };

        return Response.json(payload);
    } catch (err) {
        console.error('[/api/pbox/claim-request] Error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
