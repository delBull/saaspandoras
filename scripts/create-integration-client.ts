import { db } from "../apps/dashboard/src/db";
import { integrationClients } from "../apps/dashboard/src/db/schema";
import { IntegrationKeyService } from "../apps/dashboard/src/lib/integrations/auth";
import crypto from 'crypto';

/**
 * CLI Script to create a new Integration Client
 * Usage: ts-node scripts/create-integration-client.ts <name> <environment>
 */
async function main() {
    const args = process.argv.slice(2);
    const name = args[0];
    const env = args[1] as 'staging' | 'production';

    if (!name || !env) {
        console.error("Usage: ts-node scripts/create-integration-client.ts <name> <environment>");
        process.exit(1);
    }

    if (env !== 'staging' && env !== 'production') {
        console.error("Environment must be 'staging' or 'production'");
        process.exit(1);
    }

    console.log(`🚀 Creating Integration Client: ${name} (${env})...`);

    // 1. Generate API Key
    const { key, hash, fingerprint } = IntegrationKeyService.generateKey(env);

    // 2. Generate Callback Secret
    const callbackSecret = crypto.randomBytes(32).toString('hex');
    const callbackSecretHash = IntegrationKeyService.hashKey(callbackSecret);

    // 3. Insert into DB
    try {
        const [client] = await db.insert(integrationClients).values({
            name,
            environment: env,
            apiKeyHash: hash,
            keyFingerprint: fingerprint,
            callbackSecretHash: callbackSecretHash,
            permissions: ['deploy', 'read'], // Default permissions
            isActive: true,
        }).returning();

        console.log("\n✅ Integration Client Created Successfully!");
        console.log("---------------------------------------------------");
        console.log(`Client ID:        ${client.id}`);
        console.log(`Environment:      ${client.environment}`);
        console.log("---------------------------------------------------");
        console.log("🔐 PANDORA_CORE_KEY (Store it! It will not be shown again):");
        console.log(key);
        console.log("---------------------------------------------------");
        console.log("🔑 CORE_CALLBACK_SECRET (Store it!):");
        console.log(callbackSecret);
        console.log("---------------------------------------------------");
        console.log("⚠️  WARNING: If you lose these keys, you must rotate them.");

    } catch (error) {
        console.error("Error creating client:", error);
    } finally {
        process.exit(0);
    }
}

main();
