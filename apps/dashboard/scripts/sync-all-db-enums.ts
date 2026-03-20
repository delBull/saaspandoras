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
    // Add value if not exists - using a robust check
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'project_status' AND e.enumlabel = 'active_client') THEN
          ALTER TYPE project_status ADD VALUE 'active_client';
          RAISE NOTICE 'Added active_client to project_status';
        ELSE
          RAISE NOTICE 'active_client already exists in project_status';
        END IF;
      END
      $$;
    `);

    console.log(`✅ ${name}: project_status enum check completed.`);
    
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
