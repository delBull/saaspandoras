-- 0098: P0.4 — Reporting (gasto comprobado + snapshots reproducibles).
--
-- Sin integración de Ads API: el gasto se captura manualmente con evidencia.
-- `ad_spend_actual` SOLO suma entradas con evidencia registrada.
--
-- NO APLICAR sin autorización explícita de despliegue.

CREATE TABLE IF NOT EXISTS "ad_spend_entries" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "organization_id" varchar(256) NOT NULL,
  "platform" varchar(32) NOT NULL,
  "period_start" timestamp with time zone NOT NULL,
  "period_end" timestamp with time zone NOT NULL,
  "amount_usd" numeric(14,2) NOT NULL,
  "evidence_type" varchar(32) NOT NULL,
  "evidence_ref" varchar(512) NOT NULL,
  "entered_by" varchar(128) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ad_spend_platform_chk" CHECK ("platform" IN ('meta','google','other')),
  CONSTRAINT "ad_spend_evidence_chk" CHECK ("evidence_type" IN ('invoice','screenshot','api')),
  CONSTRAINT "ad_spend_amount_chk" CHECK ("amount_usd" >= 0),
  CONSTRAINT "ad_spend_period_chk" CHECK ("period_end" >= "period_start"),
  -- Sin evidencia no hay gasto comprobado.
  CONSTRAINT "ad_spend_evidence_ref_chk" CHECK (length("evidence_ref") > 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ad_spend_entries_org_period_idx"
  ON "ad_spend_entries" ("organization_id","period_start");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "report_snapshots" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "organization_id" varchar(256) NOT NULL,
  "week_start" timestamp with time zone NOT NULL,
  "week_end" timestamp with time zone NOT NULL,
  "timezone" varchar(64) NOT NULL,
  "rule_version" varchar(32) NOT NULL,
  "inputs_hash" varchar(64) NOT NULL,
  "report_json" jsonb NOT NULL,
  "generated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "report_snapshots_org_week_unique"
  ON "report_snapshots" ("organization_id","week_start","inputs_hash");
