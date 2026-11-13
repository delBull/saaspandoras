-- 0099: P0.4 — Presupuesto publicitario COMPROMETIDO.
--
-- Tabla separada del gasto real a propósito: el presupuesto NO puede sumarse a
-- `ad_spend_actual` ni alimentar el CPL. La separación física evita el error.
--
-- NO APLICAR sin autorización explícita de despliegue.

CREATE TABLE IF NOT EXISTS "ad_budget_commitments" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "organization_id" varchar(256) NOT NULL,
  "platform" varchar(32) NOT NULL,
  "period_start" timestamp with time zone NOT NULL,
  "period_end" timestamp with time zone NOT NULL,
  "amount_usd" numeric(14,2) NOT NULL,
  "approved_by" varchar(128) NOT NULL,
  "approval_request_id" varchar(128),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ad_budget_platform_chk" CHECK ("platform" IN ('meta','google','other')),
  CONSTRAINT "ad_budget_amount_chk" CHECK ("amount_usd" >= 0),
  CONSTRAINT "ad_budget_period_chk" CHECK ("period_end" >= "period_start"),
  -- Un compromiso sin aprobador no es compromiso.
  CONSTRAINT "ad_budget_approved_by_chk" CHECK (length("approved_by") > 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ad_budget_commitments_org_period_idx"
  ON "ad_budget_commitments" ("organization_id","period_start");
