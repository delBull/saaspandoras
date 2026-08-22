-- Migration 0031: Hermes OS Security Architecture v1.0 (K15 & K21)
-- Adds classification column to hermes_knowledge and creates hermes_security_events append-only table.

ALTER TABLE "hermes_knowledge" 
ADD COLUMN IF NOT EXISTS "classification" varchar(50) NOT NULL DEFAULT 'PUBLIC';

CREATE TABLE IF NOT EXISTS "hermes_security_events" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "organization_id" varchar(255) NOT NULL,
  "actor_id" varchar(255),
  "event_type" varchar(100) NOT NULL,
  "severity" varchar(50) NOT NULL,
  "policy_decision" varchar(50) NOT NULL,
  "correlation_id" varchar(255) NOT NULL,
  "artifact_id" varchar(255),
  "tool_id" varchar(255),
  "classification" varchar(50),
  "content_hash" varchar(128),
  "event_hash" varchar(128) NOT NULL,
  "previous_event_hash" varchar(128) NOT NULL,
  "sequence_number" integer NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hermes_sec_tenant_idx" ON "hermes_security_events" ("organization_id");
CREATE INDEX IF NOT EXISTS "hermes_sec_correlation_idx" ON "hermes_security_events" ("correlation_id");
CREATE UNIQUE INDEX IF NOT EXISTS "hermes_sec_event_hash_unique" ON "hermes_security_events" ("event_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "hermes_sec_tenant_seq_unique" ON "hermes_security_events" ("organization_id", "sequence_number");
