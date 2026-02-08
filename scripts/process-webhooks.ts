import { WebhookProcessor } from "../apps/dashboard/src/lib/integrations/webhook-processor";

// This script simulates a Cron Job worker
// Usage: bun run scripts/process-webhooks.ts

async function run() {
    console.log("🕰️ Starting Webhook Worker...");
    try {
        await WebhookProcessor.processPendingEvents();
        console.log("🏁 Worker finished.");
        process.exit(0);
    } catch (error) {
        console.error("💥 Worker Failed:", error);
        process.exit(1);
    }
}

run();
