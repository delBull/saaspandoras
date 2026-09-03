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

const envParsed = dotenv.config({ path: '.env' }).parsed || {};
const stagingParsed = dotenv.config({ path: '.env.staging' }).parsed || {};
const localParsed = dotenv.config({ path: '.env.local' }).parsed || {};
const prodParsed = dotenv.config({ path: '.env.production' }).parsed || {};

// Prioritize remote Neon databases (staging or production pooler), never localhost for neon driver
const dbUrl = 
  process.env.DATABASE_URL_OVERRIDE ||
  prodParsed.DATABASE_URL_OVERRIDE ||
  prodParsed.DATABASE_URL ||
  process.env.DATABASE_URL_STAGING ||
  localParsed.DATABASE_URL_STAGING ||
  envParsed.DATABASE_URL ||
  stagingParsed.DATABASE_URL ||
  process.env.DATABASE_URL;

if (!dbUrl || dbUrl.includes('localhost')) {
  console.error("❌ Fatal: Valid Neon DATABASE_URL is missing in environment.");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runMigrations() {
  console.log("⚡ [Pandoras Migration Runner] Connecting to database...");
  
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
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "nexus_collaborators_email_unique" ON "nexus_collaborators" ("email");`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "nexus_collaborators_token_unique" ON "nexus_collaborators" ("token");`;

  console.log("✅ nexus_collaborators migrated successfully!");

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

runMigrations()
  .then(() => {
    console.log("🏁 All migrations executed cleanly.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Migration error:", err);
    process.exit(1);
  });
