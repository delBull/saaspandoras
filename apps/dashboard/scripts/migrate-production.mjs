/**
 * 🚀 Pandoras Production / Staging Migration Runner
 * apps/dashboard/scripts/migrate-production.mjs
 *
 * Runs essential SQL migrations safely and idempotently on Neon PostgreSQL.
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const prodParsed = dotenv.config({ path: '.env.production' }).parsed || {};
const envParsed = dotenv.config({ path: '.env' }).parsed || {};
const stagingParsed = dotenv.config({ path: '.env.staging' }).parsed || {};
const localParsed = dotenv.config({ path: '.env.local' }).parsed || {};

// Strict priority: Explicit override -> .env.production -> .env (Production Neon ep-spring-mountain) -> remote staging -> process.env
const candidates = [
  process.env.DATABASE_URL_OVERRIDE,
  prodParsed.DATABASE_URL_OVERRIDE,
  prodParsed.DATABASE_URL,
  envParsed.DATABASE_URL,
  process.env.DATABASE_URL_STAGING,
  stagingParsed.DATABASE_URL,
  process.env.DATABASE_URL,
  localParsed.DATABASE_URL_STAGING,
];

const dbUrls = Array.from(
  new Set(
    candidates.filter((url) => url && !url.includes('localhost') && !url.includes('127.0.0.1'))
  )
);

if (dbUrls.length === 0) {
  console.error("❌ Fatal: Valid remote Neon DATABASE_URL is missing in environment (localhost rejected).");
  process.exit(1);
}

async function migrateDatabase(dbUrl) {
  const host = new URL(dbUrl).host;
  console.log(`\n⚡ [Pandoras Migration Runner] Connecting to database: ${host}...`);
  const sql = neon(dbUrl);
  
  // 1. nexus_collaborators table
  console.log("📦 Applying nexus_collaborators DDL & RBAC columns...");
  await sql`
    CREATE TABLE IF NOT EXISTS "nexus_collaborators" (
      "id" SERIAL PRIMARY KEY,
      "name" VARCHAR(255) NOT NULL,
      "email" VARCHAR(255) NOT NULL,
      "token" VARCHAR(128) NOT NULL,
      "role" VARCHAR(32) DEFAULT 'COLLABORATOR' NOT NULL,
      "permissions" JSONB DEFAULT '{}'::jsonb,
      "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
      "last_access_at" TIMESTAMP WITH TIME ZONE,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      CONSTRAINT "nexus_collaborators_email_unique" UNIQUE("email"),
      CONSTRAINT "nexus_collaborators_token_unique" UNIQUE("token")
    );
  `;
  await sql`ALTER TABLE "nexus_collaborators" ADD COLUMN IF NOT EXISTS "role" VARCHAR(32) DEFAULT 'COLLABORATOR' NOT NULL;`;
  await sql`ALTER TABLE "nexus_collaborators" ADD COLUMN IF NOT EXISTS "permissions" JSONB DEFAULT '{}'::jsonb;`;
  // Migration 0048 & 0050 — Nexus collaborators provisioning & omnichannel status
  await sql`ALTER TABLE "nexus_collaborators" ADD COLUMN IF NOT EXISTS "status" VARCHAR(16) DEFAULT 'ACTIVE' NOT NULL;`;
  await sql`ALTER TABLE "nexus_collaborators" ADD COLUMN IF NOT EXISTS "status_changed_at" TIMESTAMP WITH TIME ZONE;`;
  await sql`ALTER TABLE "nexus_collaborators" ADD COLUMN IF NOT EXISTS "discord_user_id" VARCHAR(255);`;
  await sql`ALTER TABLE "nexus_collaborators" ADD COLUMN IF NOT EXISTS "whatsapp_phone" VARCHAR(50);`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "nexus_collaborators_email_unique" ON "nexus_collaborators" ("email");`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "nexus_collaborators_token_unique" ON "nexus_collaborators" ("token");`;

  console.log("✅ nexus_collaborators migrated successfully!");

  // Migration 0049 — Scheduling slots reservations & sovereign holds
  console.log("📦 Applying scheduling_slots reservation columns...");
  await sql`ALTER TABLE "scheduling_slots" ADD COLUMN IF NOT EXISTS "reserved_until" TIMESTAMP WITH TIME ZONE;`;
  await sql`ALTER TABLE "scheduling_slots" ADD COLUMN IF NOT EXISTS "reserved_by" VARCHAR(255);`;
  console.log("✅ scheduling_slots reservations migrated successfully!");

  // Migration 0038 & 0043 — hermes_conversations collaborator & identity links
  console.log("📦 Applying hermes_conversations assigned_collaborator_id & identity_id columns...");
  await sql`ALTER TABLE "hermes_conversations" ADD COLUMN IF NOT EXISTS "assigned_collaborator_id" integer;`;
  await sql`ALTER TABLE "hermes_conversations" ADD COLUMN IF NOT EXISTS "identity_id" uuid;`;
  console.log("✅ hermes_conversations columns migrated successfully!");

  // Migration 0052 — contact_doctrine_seals table (K25 Sovereign Knowledge Vault)
  console.log("📦 Applying contact_doctrine_seals DDL...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "contact_doctrine_seals" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "lead_id" UUID NOT NULL REFERENCES "marketing_leads"("id") ON DELETE CASCADE,
        "version" INTEGER DEFAULT 1 NOT NULL,
        "cid" VARCHAR(128) NOT NULL,
        "ipfs_uri" VARCHAR(160),
        "content_hash" VARCHAR(64) NOT NULL,
        "contact_ref" VARCHAR(64) NOT NULL,
        "hmac_signature" VARCHAR(128),
        "agent_signature" TEXT,
        "pinned" BOOLEAN DEFAULT false NOT NULL,
        "integrity" BOOLEAN DEFAULT false NOT NULL,
        "pending_replica" BOOLEAN DEFAULT true NOT NULL,
        "provider" VARCHAR(32),
        "sealed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        CONSTRAINT "contact_doctrine_seals_lead_version_uq" UNIQUE("lead_id", "version")
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS "contact_doctrine_seals_lead_idx" ON "contact_doctrine_seals" ("lead_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "contact_doctrine_seals_cid_idx" ON "contact_doctrine_seals" ("cid");`;
    console.log("✅ contact_doctrine_seals migrated successfully!");
  } catch (err) {
    console.warn(`⚠️ [Pandoras Migration Runner] Skipping contact_doctrine_seals on ${host} (${err.message})`);
  }

  // 2. hermes_tenant_credits table
  console.log("📦 Applying hermes_tenant_credits DDL...");
  await sql`
    CREATE TABLE IF NOT EXISTS "hermes_tenant_credits" (
      "id" VARCHAR(128) PRIMARY KEY NOT NULL,
      "tenant_id" VARCHAR(128) NOT NULL,
      "credit_balance_usd" NUMERIC(12, 4) DEFAULT '0.0000' NOT NULL,
      "total_deposited_usd" NUMERIC(12, 4) DEFAULT '0.0000' NOT NULL,
      "total_spent_usd" NUMERIC(12, 4) DEFAULT '0.0000' NOT NULL,
      "markup_percentage" INTEGER DEFAULT 35 NOT NULL,
      "is_sandbox_enabled" BOOLEAN DEFAULT true NOT NULL,
      "sandbox_balance_usd" NUMERIC(12, 4) DEFAULT '0.0000' NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      CONSTRAINT "hermes_tenant_credits_tenant_id_unique" UNIQUE("tenant_id")
    );
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "hermes_tenant_credits_tenant_unique" ON "hermes_tenant_credits" ("tenant_id");`;

  // 3. hermes_compute_usage_events table
  console.log("📦 Applying hermes_compute_usage_events DDL...");
  await sql`
    CREATE TABLE IF NOT EXISTS "hermes_compute_usage_events" (
      "id" VARCHAR(128) PRIMARY KEY NOT NULL,
      "tenant_id" VARCHAR(128) NOT NULL,
      "request_id" VARCHAR(128),
      "capability" VARCHAR(128) NOT NULL,
      "provider" VARCHAR(64) DEFAULT 'runpod' NOT NULL,
      "endpoint_id" VARCHAR(128),
      "execution_seconds" NUMERIC(8, 3) DEFAULT '0.000',
      "raw_cost_usd" NUMERIC(10, 5) DEFAULT '0.00000' NOT NULL,
      "markup_cost_usd" NUMERIC(10, 5) DEFAULT '0.00000' NOT NULL,
      "total_charged_usd" NUMERIC(10, 5) DEFAULT '0.00000' NOT NULL,
      "currency" VARCHAR(16) DEFAULT 'USD',
      "status" VARCHAR(32) DEFAULT 'SETTLED',
      "is_sandbox" BOOLEAN DEFAULT false NOT NULL,
      "metadata_json" JSONB,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS "hermes_compute_events_tenant_idx" ON "hermes_compute_usage_events" ("tenant_id");`;
  await sql`CREATE INDEX IF NOT EXISTS "hermes_compute_events_req_idx" ON "hermes_compute_usage_events" ("request_id");`;

  // 4. hermes_runpod_endpoints table
  console.log("📦 Applying hermes_runpod_endpoints DDL...");
  await sql`
    CREATE TABLE IF NOT EXISTS "hermes_runpod_endpoints" (
      "id" VARCHAR(128) PRIMARY KEY NOT NULL,
      "tenant_id" VARCHAR(128),
      "endpoint_id" VARCHAR(128) NOT NULL,
      "endpoint_name" VARCHAR(128) NOT NULL,
      "model_type" VARCHAR(64) NOT NULL,
      "gpu_type" VARCHAR(64) DEFAULT 'NVIDIA RTX A4000',
      "per_second_cost_usd" NUMERIC(10, 6) DEFAULT '0.000350',
      "status" VARCHAR(32) DEFAULT 'ACTIVE',
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      CONSTRAINT "hermes_runpod_endpoints_endpoint_id_unique" UNIQUE("endpoint_id")
    );
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "hermes_runpod_endpoints_ep_unique" ON "hermes_runpod_endpoints" ("endpoint_id");`;
  await sql`CREATE INDEX IF NOT EXISTS "hermes_runpod_endpoints_tenant_idx" ON "hermes_runpod_endpoints" ("tenant_id");`;

  console.log("✅ All Hermes Compute & Credit tables migrated successfully!");

  // Verify
  const tables = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('nexus_collaborators', 'hermes_tenant_credits', 'hermes_compute_usage_events', 'hermes_runpod_endpoints');
  `;

  console.log("🎉 [Pandoras Migration Runner] Verified table existence:");
  for (const t of tables) {
    console.log(`  - ${t.table_name} (ONLINE)`);
  }
}

async function runAll() {
  for (const url of dbUrls) {
    await migrateDatabase(url);
  }
}

runAll()
  .then(() => {
    console.log("\n🏁 All configured databases migrated cleanly.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Migration error:", err);
    process.exit(1);
  });

