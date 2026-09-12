-- Migration 0053 — Tenant Social Distribution Channels & Secret Vault
-- Idempotent: safe to run multiple times.
CREATE TABLE IF NOT EXISTS "tenant_social_integrations" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "tenant_id" varchar(128) NOT NULL,
  "channel" varchar(32) NOT NULL,
  "account_name" varchar(255) NOT NULL,
  "account_handle" varchar(255) NOT NULL,
  "status" varchar(32) DEFAULT 'CONNECTED' NOT NULL,
  "supported_capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "encrypted_payload" jsonb,
  "credential_fingerprint" varchar(64),
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "last_verified_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "revoked_by" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "tenant_social_integrations_tenant_channel_idx" ON "tenant_social_integrations" ("tenant_id", "channel");
CREATE INDEX IF NOT EXISTS "tenant_social_integrations_tenant_status_idx" ON "tenant_social_integrations" ("tenant_id", "status");
