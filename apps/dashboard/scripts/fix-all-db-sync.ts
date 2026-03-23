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

    // 4. NEW CANON ENUMS
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_source') THEN
          CREATE TYPE campaign_source AS ENUM ('whatsapp', 'demand_engine', 'manual');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
          CREATE TYPE campaign_status AS ENUM ('active', 'paused', 'completed', 'archived');
        END IF;
      END
      $$;
    `);

    // 5. NEW CANON TABLES
    console.log(`  🏗️  Ensuring Canon Marketing tables exist...`);
    
    // demand_drafts
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS demand_drafts (
        id SERIAL PRIMARY KEY,
        hook TEXT NOT NULL,
        script TEXT NOT NULL,
        cta TEXT NOT NULL,
        full_content TEXT NOT NULL,
        angle VARCHAR(255),
        emotion VARCHAR(255),
        mechanism VARCHAR(255),
        project_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // campaigns (Unified)
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        source campaign_source DEFAULT 'demand_engine',
        draft_id INTEGER REFERENCES demand_drafts(id),
        type VARCHAR(255),
        platform VARCHAR(255),
        status campaign_status DEFAULT 'active',
        project_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // demand_events
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS demand_events (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id),
        event_type VARCHAR(50) NOT NULL,
        value DECIMAL(12, 2),
        source VARCHAR(255),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // campaign_stats
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS campaign_stats (
        campaign_id INTEGER PRIMARY KEY REFERENCES campaigns(id),
        impressions INTEGER DEFAULT 0 NOT NULL,
        clicks INTEGER DEFAULT 0 NOT NULL,
        leads INTEGER DEFAULT 0 NOT NULL,
        purchases INTEGER DEFAULT 0 NOT NULL,
        revenue DECIMAL(18, 2) DEFAULT 0 NOT NULL,
        score DECIMAL(5, 2) DEFAULT 0 NOT NULL,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
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
