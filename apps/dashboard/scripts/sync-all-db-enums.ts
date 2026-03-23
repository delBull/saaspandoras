import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local for database URLs
dotenv.config({ path: path.resolve(process.cwd(), 'apps/dashboard/.env.local') });

const envs = [
  { name: 'LOCAL', url: process.env.DATABASE_URL },
  { name: 'STAGING', url: process.env.DATABASE_URL_STAGING },
  { name: 'MAIN', url: process.env.DATABASE_URL_MAIN }
];

async function syncEnum(name: string, url: string) {
  console.log(`📡 Syncing ${name} database enums...`);
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  const sql = postgres(url, { 
    ssl: isLocal ? false : 'require' 
  });

  try {
    // 1. project_status enum
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'project_status' AND e.enumlabel = 'active_client') THEN
          ALTER TYPE project_status ADD VALUE 'active_client';
        END IF;
      END
      $$;
    `);

    // 2. campaign_source enum
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_source') THEN
          CREATE TYPE campaign_source AS ENUM ('whatsapp', 'demand_engine', 'manual');
        END IF;
      END
      $$;
    `);

    // 3. campaign_status enum
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
          CREATE TYPE campaign_status AS ENUM ('active', 'paused', 'completed', 'archived');
        END IF;
      END
      $$;
    `);

    console.log(`✅ ${name}: Enums synchronized.`);
    
  } catch (e) {
    console.error(`❌ ${name} Sync Error:`, (e as Error).message);
  } finally {
    await sql.end();
  }
}

async function run() {
  console.log('🚀 Starting Database Enum Synchronization...');
  for (const env of envs) {
    if (env.url) {
      await syncEnum(env.name, env.url);
    } else {
      console.warn(`⚠️ Skipping ${env.name}: URL not found in environment.`);
    }
  }
  console.log('🏁 Synchronization finished.');
}

run().catch(console.error);
