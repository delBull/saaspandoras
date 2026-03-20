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

async function fixDB(name: string, url: string) {
  console.log(`📡 Fixing ${name} database schema...`);
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

    // 2. administrators table - add missing columns found in comparison
    await sql.unsafe(`
      ALTER TABLE administrators 
      ADD COLUMN IF NOT EXISTS allowed_domains JSONB DEFAULT '[]'::jsonb NOT NULL,
      ADD COLUMN IF NOT EXISTS secret_key VARCHAR(255);
    `);

    // 3. integration_clients table - add missing columns found in comparison
    await sql.unsafe(`
      ALTER TABLE integration_clients 
      ADD COLUMN IF NOT EXISTS project_id INTEGER;
    `);

    console.log(`✅ ${name}: Schema fixed and synchronized.`);
    
  } catch (e) {
    console.error(`❌ ${name} Fix Error:`, (e as Error).message);
  } finally {
    await sql.end();
  }
}

async function run() {
  console.log('🚀 Starting Comprehensive Database Synchronization (LOCAL + STAGING + MAIN)...');
  for (const env of envs) {
    if (env.url) {
      await fixDB(env.name, env.url);
    } else {
      console.warn(`⚠️ Skipping ${env.name}: URL not found.`);
    }
  }
  console.log('🏁 All databases synchronized successfully.');
}

run().catch(console.error);
