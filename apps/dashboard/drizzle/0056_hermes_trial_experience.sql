-- 0056_hermes_trial_experience.sql
-- 🏛️ HERMES GOVERNED TRIAL TENANT ECONOMY & TIMELINE (GATES 1, 6 & 8)

-- 1. Extend projects table with tenant lifecycle and trial state
ALTER TABLE "projects" 
  ADD COLUMN IF NOT EXISTS "tenant_type" varchar(32) DEFAULT 'PRODUCTION' NOT NULL,
  ADD COLUMN IF NOT EXISTS "trial_tier" varchar(32) DEFAULT 'SOFTWARE_ONLY',
  ADD COLUMN IF NOT EXISTS "trial_started_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "trial_status" varchar(32) DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "project_tenant_type_idx" ON "projects" ("tenant_type");
CREATE INDEX IF NOT EXISTS "project_trial_ends_at_idx" ON "projects" ("trial_ends_at");

-- 2. Create hermes_trial_credits capacity table
CREATE TABLE IF NOT EXISTS "hermes_trial_credits" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "tenant_id" varchar(128) NOT NULL,
  "credit_type" varchar(32) DEFAULT 'MEDIA' NOT NULL,
  "granted_credits" integer DEFAULT 0 NOT NULL,
  "reserved_credits" integer DEFAULT 0 NOT NULL,
  "consumed_credits" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "hermes_trial_credits_tenant_unique" ON "hermes_trial_credits" ("tenant_id");

-- 3. Create hermes_trial_events timeline table
CREATE TABLE IF NOT EXISTS "hermes_trial_events" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "tenant_id" varchar(128) NOT NULL,
  "event_type" varchar(64) NOT NULL,
  "actor_id" varchar(128),
  "metadata_json" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hermes_trial_events_tenant_event_idx" ON "hermes_trial_events" ("tenant_id", "event_type");
CREATE INDEX IF NOT EXISTS "hermes_trial_events_created_at_idx" ON "hermes_trial_events" ("created_at");
