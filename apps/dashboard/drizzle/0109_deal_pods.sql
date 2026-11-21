-- 0109 · Deal Pods (mini-tenant de oportunidad)
-- Aditiva. No toca tablas existentes salvo agregar pod_id nullable a nexus_deal_rooms.

CREATE TABLE IF NOT EXISTS "nexus_deal_pods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(64) NOT NULL UNIQUE,
  "display_name" varchar(255) NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "confidentiality" varchar(24) NOT NULL DEFAULT 'OFF_MARKET',
  "fee_entity" varchar(255),
  "fee_pct" numeric(5,2),
  "currency" varchar(8) NOT NULL DEFAULT 'USD',
  "canonical_org_id" varchar(256) NOT NULL DEFAULT 'pandoras',
  "created_by" varchar(255),
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "archived_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "nexus_outreach_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pod_id" uuid NOT NULL REFERENCES "nexus_deal_pods"("id") ON DELETE CASCADE,
  "code" varchar(64) NOT NULL UNIQUE,
  "door" varchar(32),
  "target_label" varchar(255),
  "target_org" varchar(255),
  "target_role" varchar(255),
  "disabled_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "nexus_outreach_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "link_id" uuid NOT NULL REFERENCES "nexus_outreach_links"("id") ON DELETE CASCADE,
  "event" varchar(24) NOT NULL DEFAULT 'OPEN',
  "ip_hash" varchar(64),
  "user_agent" text,
  "referer" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "nexus_deal_rooms"
  ADD COLUMN IF NOT EXISTS "pod_id" uuid REFERENCES "nexus_deal_pods"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_deal_pods_status" ON "nexus_deal_pods" ("status");
CREATE INDEX IF NOT EXISTS "idx_outreach_links_pod" ON "nexus_outreach_links" ("pod_id");
CREATE INDEX IF NOT EXISTS "idx_outreach_events_link" ON "nexus_outreach_events" ("link_id", "at");
CREATE INDEX IF NOT EXISTS "idx_deal_rooms_pod" ON "nexus_deal_rooms" ("pod_id");
