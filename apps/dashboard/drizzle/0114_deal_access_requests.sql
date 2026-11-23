-- 0114 · Solicitudes de acceso a Deal Rooms (categoría Deal Pod)
-- Aditiva. No toca CRM (`clients`) ni `marketing_leads`: cada solicitud vive en
-- su pod y su sala, para no mezclar leads de otros canales.

CREATE TABLE IF NOT EXISTS "nexus_deal_access_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pod_id" uuid NOT NULL REFERENCES "nexus_deal_pods"("id") ON DELETE CASCADE,
  "room_id" uuid NOT NULL REFERENCES "nexus_deal_rooms"("id") ON DELETE CASCADE,
  "canonical_org_id" varchar(256) NOT NULL DEFAULT 'pandoras',
  "email" varchar(255) NOT NULL,
  "name" varchar(255),
  "company" varchar(255),
  "role" varchar(255),
  "message" text,
  "consent" boolean NOT NULL DEFAULT false,
  "status" varchar(16) NOT NULL DEFAULT 'PENDING',
  "source" varchar(32) NOT NULL DEFAULT 'landing',
  "src_code" varchar(64),
  "referrer" text,
  "utm" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "ip_hash" varchar(64),
  "user_agent" text,
  "decided_by" varchar(255),
  "decided_at" timestamptz,
  "decision_note" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_access_requests_room_email"
  ON "nexus_deal_access_requests" ("room_id", "email");
CREATE INDEX IF NOT EXISTS "idx_access_requests_pod_status"
  ON "nexus_deal_access_requests" ("pod_id", "status");
CREATE INDEX IF NOT EXISTS "idx_access_requests_org"
  ON "nexus_deal_access_requests" ("canonical_org_id");
