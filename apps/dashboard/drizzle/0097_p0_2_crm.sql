-- 0097: P0.2 — CRM mínimo (Growth OS).
--
-- Tablas NUEVAS: no se altera `clients`, `marketing_leads` ni `projects`.
-- Un pipeline por organización (`is_default`); `pipeline_id` presente en etapas y
-- oportunidades para evolucionar sin migración destructiva.
--
-- `clients` NO está particionado por organización ⇒ `client_id` queda sin uso
-- verificable en v1 (la capa de aplicación lo rechaza con CLIENT_ORG_UNVERIFIABLE).
--
-- NO APLICAR sin autorización explícita de despliegue.

CREATE TABLE IF NOT EXISTS "crm_pipelines" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "organization_id" varchar(256) NOT NULL,
  "name" varchar(128) NOT NULL,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_pipelines_org_default_unique"
  ON "crm_pipelines" ("organization_id","is_default");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_stages" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "pipeline_id" varchar(128) NOT NULL,
  "key" varchar(64) NOT NULL,
  "name" varchar(128) NOT NULL,
  "position" integer NOT NULL,
  "kind" varchar(16) NOT NULL DEFAULT 'open',
  "requires_next_action" boolean NOT NULL DEFAULT false,
  CONSTRAINT "crm_stages_kind_chk" CHECK ("kind" IN ('open','won','lost'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_stages_pipeline_key_unique"
  ON "crm_stages" ("pipeline_id","key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_stages_pipeline_position_idx"
  ON "crm_stages" ("pipeline_id","position");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_opportunities" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "organization_id" varchar(256) NOT NULL,
  "project_id" integer NOT NULL,
  "pipeline_id" varchar(128) NOT NULL,
  "stage_key" varchar(64) NOT NULL,
  "lead_id" uuid,
  "client_id" text,
  "owner_collaborator_id" varchar(128) NOT NULL,
  "title" varchar(256) NOT NULL,
  "estimated_value_usd" numeric(14,2) NOT NULL,
  "closed_revenue_usd" numeric(14,2),
  "currency" varchar(8) NOT NULL DEFAULT 'USD',
  "source" varchar(32) NOT NULL,
  "utm_source" varchar(128),
  "utm_medium" varchar(128),
  "utm_campaign" varchar(128),
  "next_action" varchar(256),
  "next_action_at" timestamp with time zone,
  "last_contact_at" timestamp with time zone,
  "closed_at" timestamp with time zone,
  "close_reason" varchar(256),
  "origin_locked_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_by" varchar(128) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  -- Estimación ≥ 0; ingreso cerrado (si existe) ≥ 0.
  CONSTRAINT "crm_opp_estimated_nonneg_chk" CHECK ("estimated_value_usd" >= 0),
  CONSTRAINT "crm_opp_closed_nonneg_chk" CHECK ("closed_revenue_usd" IS NULL OR "closed_revenue_usd" >= 0),
  -- Ganada/perdida exigen motivo de cierre.
  CONSTRAINT "crm_opp_close_reason_chk" CHECK (
    "stage_key" NOT IN ('ganada','perdida') OR "close_reason" IS NOT NULL
  )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_opportunities_org_stage_idx"
  ON "crm_opportunities" ("organization_id","stage_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_opportunities_org_owner_idx"
  ON "crm_opportunities" ("organization_id","owner_collaborator_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_opportunities_next_action_idx"
  ON "crm_opportunities" ("next_action_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_activities" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "organization_id" varchar(256) NOT NULL,
  "opportunity_id" varchar(128) NOT NULL,
  "type" varchar(32) NOT NULL,
  "author_collaborator_id" varchar(128) NOT NULL,
  "content" text NOT NULL,
  "outcome" varchar(256),
  "occurred_at" timestamp with time zone NOT NULL DEFAULT now(),
  "metadata" jsonb,
  CONSTRAINT "crm_activities_type_chk" CHECK (
    "type" IN ('call','message','email','visit','note','stage_change','assignment')
  )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_activities_opportunity_idx"
  ON "crm_activities" ("opportunity_id","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_activities_org_idx"
  ON "crm_activities" ("organization_id");

--> statement-breakpoint

-- Solicitudes de reasignación con aprobación (ver nota en schema.ts: NO se
-- reutiliza `nexus_action_requests` porque su actor_identity_id es entero).
CREATE TABLE IF NOT EXISTS "crm_reassignment_requests" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "organization_id" varchar(256) NOT NULL,
  "opportunity_id" varchar(128) NOT NULL,
  "owner_from" varchar(128) NOT NULL,
  "owner_to" varchar(128) NOT NULL,
  "requested_by" varchar(128) NOT NULL,
  "reason" text,
  "status" varchar(32) NOT NULL DEFAULT 'pending',
  "decided_by" varchar(128),
  "decided_at" timestamp with time zone,
  "decision_note" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "crm_reassign_status_chk" CHECK ("status" IN ('pending','approved','rejected','cancelled')),
  CONSTRAINT "crm_reassign_self_approval_chk" CHECK ("decided_by" IS NULL OR "decided_by" <> "requested_by")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_reassignment_requests_org_status_idx"
  ON "crm_reassignment_requests" ("organization_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_reassignment_requests_opportunity_idx"
  ON "crm_reassignment_requests" ("opportunity_id");
