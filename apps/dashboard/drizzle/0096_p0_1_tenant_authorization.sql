-- 0096: P0.1 — Autorización de tenant (operadores humanos) y equipos.
--
-- Contexto: `hermes_capability_grants` es AGENTE↔AGENTE (`grantee_agent_id`) y no
-- puede representar operadores humanos. Se crea una tabla propia para esa autoridad.
-- Las solicitudes de reasignación NO crean tabla: reutilizan `nexus_action_requests`.
--
-- NO APLICAR sin autorización explícita de despliegue.

CREATE TABLE IF NOT EXISTS "tenant_authorization_grants" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "canonical_org_id" varchar(256) NOT NULL,
  "subject_kind" varchar(16) NOT NULL DEFAULT 'human',
  "subject_id" varchar(128) NOT NULL,
  "capabilities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "scope_kind" varchar(16) NOT NULL DEFAULT 'organization',
  "scope_project_id" integer,
  "issued_by" varchar(128) NOT NULL,
  "issued_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "approval_request_id" varchar(128),
  -- Solo operadores humanos: una identidad de máquina no recibe grants de tenant.
  CONSTRAINT "tenant_auth_grants_subject_human_chk" CHECK ("subject_kind" = 'human'),
  CONSTRAINT "tenant_auth_grants_scope_chk" CHECK ("scope_kind" IN ('organization','project')),
  -- Un scope de proyecto exige proyecto; uno de organización no lo admite.
  CONSTRAINT "tenant_auth_grants_scope_project_chk" CHECK (
    ("scope_kind" = 'project' AND "scope_project_id" IS NOT NULL)
    OR ("scope_kind" = 'organization' AND "scope_project_id" IS NULL)
  )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_auth_grants_org_subject_idx"
  ON "tenant_authorization_grants" ("canonical_org_id","subject_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_auth_grants_active_idx"
  ON "tenant_authorization_grants" ("canonical_org_id","revoked_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "nexus_team_memberships" (
  "canonical_org_id" varchar(256) NOT NULL,
  "team_key" varchar(128) NOT NULL,
  "member_identity" varchar(128) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("canonical_org_id","team_key","member_identity")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nexus_team_memberships_member_idx"
  ON "nexus_team_memberships" ("canonical_org_id","member_identity");
