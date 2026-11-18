-- 0095: P0.3 — Media Delivery. Aditivo: NO altera `hermes_artifacts`.
--
-- Separación de fuentes de verdad:
--   hermes_artifact_versions        → estado de NEGOCIO por versión (aprobación/publicación)
--   hermes_artifact_storage         → estado FÍSICO por versión (proveedor, clave, hash)
--   hermes_artifact_events          → bitácora inmutable append-only
--   hermes_artifact_delivery_tokens → tokens de entrega revocables (jti, sin token en claro)
--
-- NO APLICAR sin autorización explícita de despliegue.

CREATE TABLE IF NOT EXISTS "hermes_artifact_versions" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "artifact_id" varchar(128) NOT NULL,
  "tenant_id" varchar(128) NOT NULL,
  "version" integer NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'draft',
  "sha256" varchar(64) NOT NULL,
  "size_bytes" integer,
  "content_type" varchar(255),
  "created_by_kind" varchar(16) NOT NULL,
  "created_by_id" varchar(128) NOT NULL,
  "created_by_owner_id" varchar(128),
  "approved_by_kind" varchar(16),
  "approved_by_id" varchar(128),
  "approved_at" timestamp with time zone,
  "last_edited_by_kind" varchar(16),
  "last_edited_by_id" varchar(128),
  "rejected_reason" text,
  "replaced_by_version" integer,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "hermes_artifact_versions_status_chk" CHECK (
    "status" IN ('draft','in_review','approved','rejected','published','replaced','deleted')
  ),
  -- El aprobador es SIEMPRE humano (nunca una máquina).
  CONSTRAINT "hermes_artifact_versions_approver_human_chk" CHECK (
    "approved_by_kind" IS NULL OR "approved_by_kind" = 'human'
  )
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hermes_artifact_versions_av_unique"
  ON "hermes_artifact_versions" ("artifact_id","version");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_artifact_versions_status_idx"
  ON "hermes_artifact_versions" ("artifact_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_artifact_versions_tenant_idx"
  ON "hermes_artifact_versions" ("tenant_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "hermes_artifact_storage" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "artifact_id" varchar(128) NOT NULL,
  "version" integer NOT NULL,
  "physical_state" varchar(32) NOT NULL DEFAULT 'stored',
  "provider" varchar(32) NOT NULL,
  "storage_key" varchar(1024) NOT NULL,
  "storage_url" text,
  "sha256" varchar(64) NOT NULL,
  "size_bytes" integer,
  "content_type" varchar(255),
  "last_verified_at" timestamp with time zone,
  "reconciliation_note" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "hermes_artifact_storage_state_chk" CHECK (
    "physical_state" IN ('stored','deletion_pending','deleted','missing')
  ),
  CONSTRAINT "hermes_artifact_storage_provider_chk" CHECK ("provider" IN ('blob','ipfs'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hermes_artifact_storage_av_unique"
  ON "hermes_artifact_storage" ("artifact_id","version");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_artifact_storage_provider_key_idx"
  ON "hermes_artifact_storage" ("provider","storage_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_artifact_storage_state_idx"
  ON "hermes_artifact_storage" ("physical_state");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "hermes_artifact_events" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "artifact_id" varchar(128) NOT NULL,
  "version" integer,
  "type" varchar(32) NOT NULL,
  "actor_kind" varchar(16) NOT NULL,
  "actor_id" varchar(128) NOT NULL,
  "previous_state" varchar(32),
  "new_state" varchar(32),
  "reason" text,
  "metadata_json" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "hermes_artifact_events_type_chk" CHECK (
    "type" IN ('generated','stored','submitted','approved','rejected','published',
               'unpublished','deleted','replaced','delivered','revoked')
  )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_artifact_events_artifact_idx"
  ON "hermes_artifact_events" ("artifact_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "hermes_artifact_delivery_tokens" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "artifact_id" varchar(128) NOT NULL,
  "version" integer NOT NULL,
  "tenant_id" varchar(128) NOT NULL,
  "issued_by_kind" varchar(16) NOT NULL,
  "issued_by_id" varchar(128) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "use_count" integer NOT NULL DEFAULT 0,
  "last_used_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_artifact_delivery_tokens_artifact_idx"
  ON "hermes_artifact_delivery_tokens" ("artifact_id","version");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_artifact_delivery_tokens_tenant_idx"
  ON "hermes_artifact_delivery_tokens" ("tenant_id");
