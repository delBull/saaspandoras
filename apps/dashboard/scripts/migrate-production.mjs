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

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env.staging' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ Fatal: DATABASE_URL is missing in environment.");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runMigrations() {
  console.log("⚡ [Pandoras Migration Runner] Connecting to database...");
  
  // 1. nexus_collaborators table
  console.log("📦 Applying nexus_collaborators DDL...");
  await sql`
    CREATE TABLE IF NOT EXISTS "nexus_collaborators" (
      "id" SERIAL PRIMARY KEY,
      "name" VARCHAR(255) NOT NULL,
      "email" VARCHAR(255) NOT NULL,
      "token" VARCHAR(128) NOT NULL,
      "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
      "last_access_at" TIMESTAMP WITH TIME ZONE,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      CONSTRAINT "nexus_collaborators_email_unique" UNIQUE("email"),
      CONSTRAINT "nexus_collaborators_token_unique" UNIQUE("token")
    );
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "nexus_collaborators_email_unique" ON "nexus_collaborators" ("email");`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "nexus_collaborators_token_unique" ON "nexus_collaborators" ("token");`;

  console.log("✅ nexus_collaborators migrated successfully!");

  // Verify
  const tables = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'nexus_collaborators';
  `;

  if (tables.length > 0) {
    console.log("🎉 [Pandoras Migration Runner] Verified table existence: nexus_collaborators (ONLINE)");
  } else {
    throw new Error("Table verification failed for nexus_collaborators");
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
