import crypto from 'crypto';
import { db } from '@/db';
import { webhookEvents, integrationClients } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export class WebhookService {
    /**
     * Signs a payload using HMAC-SHA256
     */
    static signPayload(payload: any, secret: string): string {
        const data = JSON.stringify(payload);
        return `sha256=${crypto.createHmac('sha256', secret).update(data).digest('hex')}`;
    }

    /**
     * Queue a webhook event to be sent.
     *
     * If clientId === 'system', it broadcasts to ALL active integration clients
     * that have a callbackUrl configured (e.g., Bull's Lab).
     *
     * This prevents FK violations and supports broadcast-style emission.
     */
    static async queueEvent(clientId: string, event: string, payload: any) {
        if (clientId === 'system') {
            // Broadcast: find all active clients with a callback URL
            const activeClients = await db.query.integrationClients.findMany({
                where: and(
                    eq(integrationClients.isActive, true),
                    isNotNull(integrationClients.callbackUrl)
                ),
                columns: { id: true },
            });

            if (activeClients.length === 0) {
                // No clients registered yet — silently skip
                return;
            }

            await db.insert(webhookEvents).values(
                activeClients.map(c => ({
                    clientId: c.id,
                    event,
                    payload,
                    status: 'pending' as const,
                    attempts: 0,
                    nextRetryAt: new Date(),
                }))
            );
        } else {
            // Targeted: send to a specific client UUID
            await db.insert(webhookEvents).values({
                clientId,
                event,
                payload,
                status: 'pending',
                attempts: 0,
                nextRetryAt: new Date(),
            });
        }
    }
}

