-- 0106 · Registro de Activos IP (Operations Hub · OPS REGISTER)
-- Migración ADITIVA: crea una tabla nueva, no toca tablas existentes.
-- Idempotente: se puede re-ejecutar sin efectos secundarios.

CREATE TABLE IF NOT EXISTS "nexus_ip_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "canonical_org_id" varchar(256) NOT NULL,
  "name" text NOT NULL,
  "category" varchar(64) NOT NULL DEFAULT 'Marca Denominativa',
  "classes" varchar(128),
  "jurisdiction" varchar(64) DEFAULT 'IMPI (México)',
  "status" varchar(24) NOT NULL DEFAULT 'PLANNED',
  "priority" varchar(16) DEFAULT 'MEDIUM',
  "risk" varchar(16) DEFAULT 'LOW',
  "risk_notes" text,
  "registry_ref" varchar(128),
  "filed_at" timestamptz,
  "granted_at" timestamptz,
  "next_action" text,
  "next_action_at" timestamptz,
  "owner_collaborator_id" integer REFERENCES "nexus_collaborators"("id") ON DELETE SET NULL,
  "created_by" integer REFERENCES "nexus_collaborators"("id") ON DELETE SET NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "archived_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_nexus_ip_assets_org_status"
  ON "nexus_ip_assets" ("canonical_org_id", "status");

CREATE INDEX IF NOT EXISTS "idx_nexus_ip_assets_org_category"
  ON "nexus_ip_assets" ("canonical_org_id", "category");

CREATE INDEX IF NOT EXISTS "idx_nexus_ip_assets_org_archived"
  ON "nexus_ip_assets" ("canonical_org_id", "archived_at");
