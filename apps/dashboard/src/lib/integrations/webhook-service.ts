import crypto from 'crypto';
import { db } from '@/db';
import { webhookEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class WebhookService {
    /**
     * Signs a payload using HMAC-SHA256
     */
    static signPayload(payload: any, secret: string): string {
        const data = JSON.stringify(payload);
        return `sha256=${crypto.createHmac('sha256', secret).update(data).digest('hex')}`;
    }

    /**
     * Queue a webhook event to be sent
     * Currently inserts into DB. A separate worker would process this.
     * For this MVP, we might trigger immediate sending logic depending on requirements,
     * but sticking to the plan of "Enterprise Grade" usually implies async queues.
     */
    static async queueEvent(clientId: string, event: string, payload: any) {
        // 1. Create Event Record
        await db.insert(webhookEvents).values({
            clientId: clientId,
            event: event,
            payload: payload,
            status: 'pending',
            attempts: 0,
            nextRetryAt: new Date() // ready immediately
        });

        // TODO: Trigger background worker if not running cron
    }
}
