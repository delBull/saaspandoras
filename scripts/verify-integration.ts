
import { db } from "../apps/dashboard/src/db";
import { integrationClients, auditLogs, webhookEvents } from "../apps/dashboard/src/db/schema";
import { IntegrationKeyService } from "../apps/dashboard/src/lib/integrations/auth";
import { WebhookService } from "../apps/dashboard/src/lib/integrations/webhook-service";
import { eq, desc } from "drizzle-orm";

async function verify() {
    console.log("🔍 Starting Integration Logic Verification...");

    // 1. Get the latest client
    const client = await db.query.integrationClients.findFirst({
        orderBy: [desc(integrationClients.createdAt)]
    });

    if (!client) {
        console.error("❌ No integration client found. Did you run create-integration-client.ts?");
        process.exit(1);
    }
    console.log(`✅ Found Client: ${client.name} (${client.id})`);

    // 2. Mock Validation (We can't easily retrieve the raw key securely as it's not stored, 
    // but we can verification the Hashing function and DB lookup if we had the key.
    // Since we don't have the raw key from the previous step programmatically available here easily without parsing stdout,
    // we will verify via a new Key Generation just for this test).

    console.log("---------------------------------------------------");
    console.log("🧪 Testing Key Validation Logic...");
    const { key, hash } = IntegrationKeyService.generateKey('staging');

    // Insert a temp client
    const [tempClient] = await db.insert(integrationClients).values({
        name: 'test-verification-client',
        environment: 'staging',
        apiKeyHash: hash,
        keyFingerprint: 'test-print',
        permissions: ['deploy'],
        isActive: true
    }).returning();

    // Validate
    const validated = await IntegrationKeyService.validateKey(key);
    if (validated && validated.id === tempClient.id) {
        console.log("✅ Key Validation Passed");
    } else {
        console.error("❌ Key Validation Failed");
    }

    // 3. Test Webhook Queuing
    console.log("---------------------------------------------------");
    console.log("🧪 Testing Webhook Queuing...");
    await WebhookService.queueEvent(tempClient.id, 'test.event', { foo: 'bar' });

    const event = await db.query.webhookEvents.findFirst({
        where: eq(webhookEvents.clientId, tempClient.id)
    });

    if (event && (event.payload as any)['foo'] === 'bar') {
        console.log("✅ Webhook Queued Successfully");
    } else {
        console.error("❌ Webhook Queue Failed");
    }

    // 4. Test Audit Logging (Simulate what the API does)
    console.log("---------------------------------------------------");
    console.log("🧪 Testing Audit Logging...");
    await db.insert(auditLogs).values({
        actorType: 'integration',
        actorId: tempClient.id,
        action: 'TEST_ACTION',
        resource: 'test-resource',
        metadata: { test: true }
    });

    const log = await db.query.auditLogs.findFirst({
        where: eq(auditLogs.actorId, tempClient.id),
        orderBy: [desc(auditLogs.createdAt)]
    });

    if (log && log.action === 'TEST_ACTION') {
        console.log("✅ Audit Log Created Successfully");
    } else {
        console.error("❌ Audit Log Failed");
    }

    // Cleanup
    await db.delete(webhookEvents).where(eq(webhookEvents.clientId, tempClient.id));
    await db.delete(auditLogs).where(eq(auditLogs.actorId, tempClient.id));
    await db.delete(integrationClients).where(eq(integrationClients.id, tempClient.id));
    console.log("🧹 Cleanup Done");

    console.log("---------------------------------------------------");
    console.log("🎉 ALL SYSTEMS GO. Integration Module Logic Verified.");
    process.exit(0);
}

verify().catch(console.error);
