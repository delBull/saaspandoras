-- Migration 0052 — Contact Doctrine Seals (K25 sovereign vault for contact directives)
-- Idempotent: safe to run multiple times.
CREATE TABLE IF NOT EXISTS "contact_doctrine_seals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "marketing_leads"("id") ON DELETE CASCADE,
  "version" integer DEFAULT 1 NOT NULL,
  "cid" varchar(128) NOT NULL,
  "ipfs_uri" varchar(160),
  "content_hash" varchar(64) NOT NULL,
  "contact_ref" varchar(64) NOT NULL,
  "hmac_signature" varchar(128),
  "agent_signature" text,
  "pinned" boolean DEFAULT false NOT NULL,
  "integrity" boolean DEFAULT false NOT NULL,
  "pending_replica" boolean DEFAULT true NOT NULL,
  "provider" varchar(32),
  "sealed_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "contact_doctrine_seals_lead_version_uq" UNIQUE("lead_id", "version")
);
CREATE INDEX IF NOT EXISTS "contact_doctrine_seals_lead_idx" ON "contact_doctrine_seals" ("lead_id");
CREATE INDEX IF NOT EXISTS "contact_doctrine_seals_cid_idx" ON "contact_doctrine_seals" ("cid");
