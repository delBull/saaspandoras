import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables (supports .env and .env.staging)
dotenv.config();
dotenv.config({ path: '.env.staging' });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("❌ DATABASE_URL is not set.");
    process.exit(1);
}

const isNeon = dbUrl.includes('neon.tech') || dbUrl.includes('sslmode=require');
const client = new Client({
    connectionString: dbUrl,
    ...(isNeon && { ssl: { rejectUnauthorized: false } })
});

async function run() {
    console.log("🔌 Connecting to NeonDB...");
    await client.connect();

    try {
        console.log("🚀 Running manual ENUM alterations...");

        // 1. Ambassador Status Enum
        // Existing values might be: 'active', 'inactive'. We want to ensure 'FOUNDER', 'TRAINING', 'ACCREDITED', 'SUSPENDED' exist.
        const newStatuses = ['APPLIED', 'FOUNDER', 'TRAINING', 'ACCREDITED', 'SUSPENDED'];
        for (const status of newStatuses) {
            try {
                await client.query(`ALTER TYPE ambassador_status ADD VALUE IF NOT EXISTS '${status}';`);
                console.log(`✅ Added '${status}' to ambassador_status ENUM`);
            } catch (err: any) {
                // If the enum doesn't exist yet, we catch it
                console.warn(`⚠️ Warning for ${status}: ${err.message}`);
            }
        }

        // 2. Ambassador Role Enum
        // If this is a completely new enum created by drizzle push, it should exist. 
        // If it was created previously and we are adding values:
        const newRoles = ['GROWTH_PARTNER', 'SENIOR_PARTNER', 'INSTITUTIONAL_PARTNER', 'INTERNAL'];
        for (const role of newRoles) {
            try {
                await client.query(`ALTER TYPE ambassador_role ADD VALUE IF NOT EXISTS '${role}';`);
                console.log(`✅ Added '${role}' to ambassador_role ENUM`);
            } catch (err: any) {
                console.warn(`⚠️ Warning for ${role}: ${err.message}`);
            }
        }

        // 3. Commission Status Enum
        const newCommStatuses = ['invested', 'approved'];
        for (const status of newCommStatuses) {
            try {
                await client.query(`ALTER TYPE commission_status ADD VALUE IF NOT EXISTS '${status}';`);
                console.log(`✅ Added '${status}' to commission_status ENUM`);
            } catch (err: any) {
                console.warn(`⚠️ Warning for commission_status ${status}: ${err.message}`);
            }
        }

        console.log("🎉 Manual ENUM migration completed successfully.");
    } catch (e) {
        console.error("❌ Migration failed:", e);
    } finally {
        await client.end();
        console.log("🔌 Disconnected.");
    }
}

run();
