-- Migration 0054 — Distribution Jobs and Execution Attempts (Fase 3)
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS "distribution_jobs" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "tenant_id" varchar(128) NOT NULL,
  "campaign_id" varchar(128) NOT NULL,
  "piece_id" varchar(128) NOT NULL,
  "channel" varchar(32) NOT NULL,
  "integration_id" varchar(36),
  "idempotency_key" varchar(255) NOT NULL,
  "status" varchar(32) DEFAULT 'PENDING' NOT NULL,
  "payload" jsonb NOT NULL,
  "primary_provider" varchar(32) DEFAULT 'SOFIA' NOT NULL,
  "active_attempt_id" varchar(36),
  "active_provider" varchar(32),
  "receipt" jsonb,
  "reconciliation_notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "distribution_jobs_tenant_idempotency_uq" ON "distribution_jobs" ("tenant_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "distribution_jobs_tenant_status_idx" ON "distribution_jobs" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "distribution_jobs_campaign_piece_idx" ON "distribution_jobs" ("campaign_id", "piece_id");

CREATE TABLE IF NOT EXISTS "distribution_execution_attempts" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "job_id" varchar(36) NOT NULL REFERENCES "distribution_jobs"("id") ON DELETE CASCADE,
  "tenant_id" varchar(128) NOT NULL,
  "attempt_number" integer NOT NULL,
  "provider" varchar(32) NOT NULL,
  "execution_id" varchar(255),
  "status" varchar(32) DEFAULT 'DISPATCHING' NOT NULL,
  "lease_expires_at" timestamp with time zone,
  "receipt" jsonb,
  "error_code" varchar(64),
  "error_message" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "distribution_attempts_job_attempt_idx" ON "distribution_execution_attempts" ("job_id", "attempt_number");
CREATE INDEX IF NOT EXISTS "distribution_attempts_tenant_provider_idx" ON "distribution_execution_attempts" ("tenant_id", "provider");
CREATE INDEX IF NOT EXISTS "distribution_attempts_execution_id_idx" ON "distribution_execution_attempts" ("execution_id");
