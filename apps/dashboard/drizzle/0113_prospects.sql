-- 0113 · Módulo de prospección (jobs + prospectos)
-- Aditiva. No modifica tablas existentes; sólo referencia pods y links del radar.

CREATE TABLE IF NOT EXISTS "nexus_prospect_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pod_id" uuid REFERENCES "nexus_deal_pods"("id") ON DELETE SET NULL,
  "canonical_org_id" varchar(256) NOT NULL DEFAULT 'pandoras',
  "label" varchar(255) NOT NULL,
  "mode" varchar(16) NOT NULL DEFAULT 'SEARCH',
  "query" text NOT NULL,
  "spec" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" varchar(16) NOT NULL DEFAULT 'QUEUED',
  "schedule" varchar(16) NOT NULL DEFAULT 'MANUAL',
  "max_age_days" integer NOT NULL DEFAULT 30,
  "min_confidence" integer NOT NULL DEFAULT 50,
  "runs" integer NOT NULL DEFAULT 0,
  "last_run_at" timestamptz,
  "next_run_at" timestamptz,
  "stats" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "last_error" text,
  "created_by" varchar(255),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "nexus_prospects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" uuid REFERENCES "nexus_prospect_jobs"("id") ON DELETE SET NULL,
  "pod_id" uuid REFERENCES "nexus_deal_pods"("id") ON DELETE SET NULL,
  "canonical_org_id" varchar(256) NOT NULL DEFAULT 'pandoras',
  "company" varchar(255),
  "person_name" varchar(255),
  "role" varchar(255),
  "email" varchar(320),
  "email_status" varchar(16) NOT NULL DEFAULT 'unverified',
  "door" varchar(32),
  "source_type" varchar(16) NOT NULL,
  "source_url" text NOT NULL,
  "source_title" text,
  "publisher" varchar(255),
  "published_at" timestamptz,
  "fetched_at" timestamptz NOT NULL DEFAULT now(),
  "confidence" integer NOT NULL DEFAULT 0,
  "extraction" varchar(16) NOT NULL DEFAULT 'regex',
  "status" varchar(16) NOT NULL DEFAULT 'NEW',
  "dedupe_key" varchar(64) NOT NULL,
  "raw" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "reject_reason" text,
  "link_id" uuid REFERENCES "nexus_outreach_links"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_prospects_org_dedupe" ON "nexus_prospects" ("canonical_org_id", "dedupe_key");
CREATE INDEX IF NOT EXISTS "idx_prospect_jobs_status" ON "nexus_prospect_jobs" ("status");
CREATE INDEX IF NOT EXISTS "idx_prospect_jobs_org" ON "nexus_prospect_jobs" ("canonical_org_id");
CREATE INDEX IF NOT EXISTS "idx_prospect_jobs_pod" ON "nexus_prospect_jobs" ("pod_id");
CREATE INDEX IF NOT EXISTS "idx_prospect_jobs_next_run" ON "nexus_prospect_jobs" ("next_run_at");
CREATE INDEX IF NOT EXISTS "idx_prospects_status" ON "nexus_prospects" ("status");
CREATE INDEX IF NOT EXISTS "idx_prospects_job" ON "nexus_prospects" ("job_id");
CREATE INDEX IF NOT EXISTS "idx_prospects_door" ON "nexus_prospects" ("door");
