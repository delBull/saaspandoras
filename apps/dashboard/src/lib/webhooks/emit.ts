/**
 * emitGamificationWebhook
 *
 * Wrapper that formats the `gamification.event` payload (v1 spec) and
 * hands it off to WebhookService.queueEvent() for HMAC signing + delivery.
 *
 * The payload is aligned with WEBHOOK_SPEC.md — consumers verify via
 * X-Pandora-Signature (HMAC-SHA256) and X-Pandora-Timestamp.
 */
import { WebhookService } from '@/lib/integrations/webhook-service';
import { createHash } from 'crypto';
import type { GamificationResult } from '@pandoras/gamification/types/bridge';

interface EmitGamificationWebhookInput {
    walletAddress: string;
    telegramUserId?: string;
    source: 'telegram' | 'dashboard' | 'system';
    eventType: string;
    metadata?: Record<string, any>;
    result: GamificationResult;
}

export async function emitGamificationWebhook(input: EmitGamificationWebhookInput): Promise<void> {
    const payload = {
        id: `evt_${crypto.randomUUID().replace(/-/g, '').substring(0, 20)}`,
        type: 'gamification.event' as const,
        version: 'v1' as const,
        timestamp: Date.now(),

        data: {
            user: {
                walletAddress: input.walletAddress,
                ...(input.telegramUserId ? { telegramUserId: input.telegramUserId } : {}),
            },
            source: input.source,
            event: {
                type: input.eventType,
                metadata: input.metadata ?? {},
            },
            effects: {
                pointsEarned: input.result.pointsEarned,
                achievementsUnlocked: input.result.achievementsUnlocked,
                rewardsGranted: input.result.rewardsGranted,
                pboxDelta: input.result.pboxDelta,
                // sha256 of effects object — lets consumers detect duplicates + forensic auditing
                effectsHash: createHash('sha256')
                    .update(JSON.stringify({
                        pointsEarned: input.result.pointsEarned,
                        achievementsUnlocked: input.result.achievementsUnlocked,
                        rewardsGranted: input.result.rewardsGranted,
                        pboxDelta: input.result.pboxDelta,
                    }))
                    .digest('hex'),
            },
            balances: {
                totalPoints: input.result.balances.totalPoints,
                pboxBalance: input.result.balances.pboxBalance,
                level: input.result.balances.level,
            },
            isSandbox: process.env.NODE_ENV !== 'production',
        },
    };

    // Queue for async delivery to all registered webhook clients
    // WebhookService handles HMAC signing, retries, and DLQ
    try {
        await WebhookService.queueEvent(
            'system',         // clientId — 'system' means all registered edges
            'gamification.event',
            payload
        );
    } catch (err) {
        // Webhook delivery failure should NEVER fail the gamification record call
        console.error('[emitGamificationWebhook] Failed to queue webhook:', err);
    }
}
