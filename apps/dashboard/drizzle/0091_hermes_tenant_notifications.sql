-- 0091: notificaciones in-app por tenant (avisos de trial/gracias, aprobaciones).
-- Idempotentes por (tenant_id, dedupe_key).

CREATE TABLE IF NOT EXISTS "hermes_tenant_notifications" (
  "id" varchar(128) PRIMARY KEY,
  "tenant_id" varchar(128) NOT NULL,
  "kind" varchar(64) NOT NULL,
  "severity" varchar(16) NOT NULL DEFAULT 'info',
  "title" varchar(200) NOT NULL,
  "body" text NOT NULL,
  "link" varchar(300),
  "dedupe_key" varchar(160) NOT NULL,
  "metadata_json" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "read_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "hermes_tenant_notifications_dedupe_idx"
  ON "hermes_tenant_notifications" ("tenant_id", "dedupe_key");

CREATE INDEX IF NOT EXISTS "hermes_tenant_notifications_tenant_idx"
  ON "hermes_tenant_notifications" ("tenant_id", "created_at");
