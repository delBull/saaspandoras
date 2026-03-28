import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const ENVS = [
  { name: 'LOCAL', url: process.env.DATABASE_URL },
  { name: 'STAGING', url: process.env.DATABASE_URL_STAGING },
  { name: 'MAIN', url: process.env.DATABASE_URL_MAIN }
];

async function migrate() {
  console.log("🧬 Starting Structural Migration: sessions.id -> UUID");

  for (const env of ENVS) {
    if (!env.url) {
      console.warn(`⚠️ Skipping ${env.name}: No DATABASE_URL found.`);
      continue;
    }

    console.log(`\n🚀 Migrating ${env.name}...`);
    const sqlChannel = postgres(env.url, { ssl: env.url.includes('neon.tech') ? 'require' : false });

    try {
      // 1. Ensure uuid-ossp or pgcrypto is available for gen_random_uuid()
      await sqlChannel`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;
      
      // 2. Structural change
      // Note: We use USING gen_random_uuid() to populate new UUIDs for any existing integer records.
      // This is necessary because they can't be converted 1:1 to unique UUIDs automatically.
      await sqlChannel`
        ALTER TABLE sessions 
        ALTER COLUMN id DROP DEFAULT,
        ALTER COLUMN id TYPE uuid USING gen_random_uuid(),
        ALTER COLUMN id SET DEFAULT gen_random_uuid();
      `;

      console.log(`✅ ${env.name} Migrated successfully.`);
      
      // Verification
      const result = await sqlChannel`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'id';
      `;
      console.log(`📊 Current Type in ${env.name}: ${result[0]?.data_type}`);

    } catch (error: any) {
      console.error(`❌ ${env.name} Migration FAILED:`, error.message);
    } finally {
      await sqlChannel.end();
    }
  }

  console.log("\n🏁 All migrations finished.");
}

migrate();
