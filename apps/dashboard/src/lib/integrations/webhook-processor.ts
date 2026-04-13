import { db } from "@/db";
import { webhookEvents, integrationClients } from "@/db/schema";
import { eq, and, lte, asc } from "drizzle-orm";
import { sendWebhook, type PandoraWebhookEvent } from "@pandoras/core-webhooks";

const MAX_RETRIES = 5;

/**
 * Webhook Processor
 * - Fetches pending events
 * - Sends them using the standardized SDK
 * - Handles retries (exponential backoff)
 * - Moves to DLQ after MAX_RETRIES
 */
export class WebhookProcessor {
    static async processPendingEvents(batchSize = 10) {
        // 🔴 KILL SWITCH: Level 1 Rollback Mechanism
        if (process.env.WEBHOOKS_ENABLED === 'false') {
            console.warn("🛑 Webhooks are DISABLED via WEBHOOKS_ENABLED=false. Skipping processing.");
            return;
        }

        console.log("🔄 Webhook Processor: Checking for pending events...");

        // 1. Fetch pending events ready for retry
        const now = new Date();
        const pendingEvents = await db.query.webhookEvents.findMany({
            where: (events, { and, eq, lte }) => and(
                eq(events.status, 'pending'),
                lte(events.nextRetryAt, now)
            ),
            limit: batchSize,
            orderBy: [asc(webhookEvents.createdAt)],
        });

        if (pendingEvents.length === 0) {
            console.log("✅ No pending events found.");
            return;
        }

        console.log(`📦 Processing ${pendingEvents.length} events...`);

        // 2. Process each event
        for (const event of pendingEvents) {
            await this.processEvent(event);
        }
    }

    private static async processEvent(event: any) {
        // Fetch the integration client for this event
        const client = await db.query.integrationClients.findFirst({
            where: eq(integrationClients.id, event.clientId)
        });

        if (!client) {
            console.error(`❌ Webhook Error: Client ID ${event.clientId} not found in database for event ${event.id}`);
            await this.markAsFailed(event.id, "Client not found", 999);
            return;
        }

        if (!client.isActive) {
            console.warn(`⚠️ Webhook Skipped: Client ${client.name} (${client.id}) is marked as INACTIVE.`);
            await this.markAsFailed(event.id, "Client is inactive", 999);
            return;
        }

        if (!client.callbackUrl) {
            console.error(`❌ Webhook Error: Client ${client.name} has NO callback URL configured.`);
            // Force DLQ state immediately if configuration is broken
            await this.markAsFailed(event.id, "Missing callback URL", 999);
            return;
        }

        try {
            console.log(`🚀 Sending event ${event.event} to ${client.callbackUrl}`);

            // Construct strictly typed event payload
            // The 'payload' in DB is jsonb, so we cast it. 
            const webhookEvent: PandoraWebhookEvent = {
                id: event.id,
                type: event.event,
                version: 'v1',
                timestamp: Math.floor(event.createdAt.getTime() / 1000),
                data: event.payload
            };

            // Use the SDK to sign and send
            // NOTE: Using callbackSecretHash as the key for now per integration status.
            // In production this must be the raw decrypted secret.
            const secretToUse = client.callbackSecretHash || "default-secret";

            const result = await sendWebhook(client.callbackUrl, secretToUse, webhookEvent);

            if (!result.success) {
                console.error(`🛑 Webhook Dispatch Failed for ${client.name}: ${result.error} (Status: ${result.statusCode})`);
                throw new Error(result.error || `HTTP ${result.statusCode}`);
            }

            // Success
            await db.update(webhookEvents)
                .set({
                    status: 'sent',
                    updatedAt: new Date()
                })
                .where(eq(webhookEvents.id, event.id));

            console.log(`✅ Event ${event.id} sent successfully.`);

        } catch (error: any) {
            console.error(`⚠️ Failed to send event ${event.id}:`, error.message);
            await this.handleRetry(event, error.message);
        }
    }

    private static async handleRetry(event: any, lastError: string) {
        const attempts = (event.attempts || 0) + 1;

        if (attempts > MAX_RETRIES) {
            await this.markAsFailed(event.id, `Max retries reached. Last error: ${lastError}`, attempts);
            return;
        }

        // Exponential backoff
        const delaySeconds = Math.pow(10, attempts - 1); // 1s, 10s, 100s... maybe too aggressive?
        // Let's use the Spec strategy:
        // 1: +30s, 2: +2m, 3: +10m, 4: +1h
        let waitSeconds = 30;
        if (attempts === 2) waitSeconds = 120; // 2m
        if (attempts === 3) waitSeconds = 600; // 10m
        if (attempts >= 4) waitSeconds = 3600; // 1h

        const nextRetry = new Date(Date.now() + waitSeconds * 1000);

        await db.update(webhookEvents)
            .set({
                attempts: attempts,
                nextRetryAt: nextRetry,
                updatedAt: new Date()
            })
            .where(eq(webhookEvents.id, event.id));

        console.log(`zzz Scheduled retry #${attempts} for event ${event.id} in ${waitSeconds}s`);
    }

    private static async markAsFailed(eventId: string, error: string, attempts: number) {
        // DLQ effectively
        await db.update(webhookEvents)
            .set({
                status: 'failed',
                attempts: attempts,
                updatedAt: new Date()
            })
            .where(eq(webhookEvents.id, eventId));

        console.error(`💀 Event ${eventId} moved to DLQ (Failed)`);
    }

    /**
     * Manually retry a failed event (Replay)
     * Resets status to 'pending' and retries count to 0.
     */
    static async retryEvent(eventId: string) {
        console.log(`🔄 Manual Replay requested for event ${eventId}`);

        await db.update(webhookEvents)
            .set({
                status: 'pending',
                attempts: 0,
                nextRetryAt: new Date(), // Immediate retry
                updatedAt: new Date()
            })
            .where(eq(webhookEvents.id, eventId));

        console.log(`✅ Event ${eventId} reset to pending.`);

        // Optionally trigger processing immediately
        await this.processPendingEvents();
    }
}
