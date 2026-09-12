-- Migration 0055 — Reconciliation Sweeper Fields & Indexes (Fase 6)
-- Idempotent: safe to run multiple times.

-- 1. hermes_media_requests sweeper & backoff fields
ALTER TABLE "hermes_media_requests" ADD COLUMN IF NOT EXISTS "reconciliation_attempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "hermes_media_requests" ADD COLUMN IF NOT EXISTS "last_reconciled_at" timestamp with time zone;
ALTER TABLE "hermes_media_requests" ADD COLUMN IF NOT EXISTS "next_reconciliation_at" timestamp with time zone;
ALTER TABLE "hermes_media_requests" ADD COLUMN IF NOT EXISTS "reconciliation_lock_until" timestamp with time zone;
CREATE INDEX IF NOT EXISTS "hermes_media_req_reconcile_idx" ON "hermes_media_requests" ("status", "next_reconciliation_at");

-- 2. distribution_jobs sweeper & backoff fields
ALTER TABLE "distribution_jobs" ADD COLUMN IF NOT EXISTS "reconciliation_attempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "distribution_jobs" ADD COLUMN IF NOT EXISTS "last_reconciled_at" timestamp with time zone;
ALTER TABLE "distribution_jobs" ADD COLUMN IF NOT EXISTS "next_reconciliation_at" timestamp with time zone;
ALTER TABLE "distribution_jobs" ADD COLUMN IF NOT EXISTS "reconciliation_lock_until" timestamp with time zone;
CREATE INDEX IF NOT EXISTS "distribution_jobs_reconcile_idx" ON "distribution_jobs" ("status", "next_reconciliation_at");
