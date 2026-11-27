-- 0128 · Recursos compartidos con aprobación del owner (ADR-021 fase 3)
--
-- Operar un Deal Pod o una sala ajena exige autorización de **su** dueño, no de
-- quien lo pide. El share es por recurso y por capability, con expiración.

CREATE TABLE IF NOT EXISTS resource_shares (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type          varchar(24)  NOT NULL,          -- pod | room | project
  resource_id            varchar(128) NOT NULL,          -- id interno o code/publicId
  owner_org_id           varchar(256) NOT NULL,
  shared_with_collab_id  integer      NOT NULL,
  capabilities           jsonb        NOT NULL DEFAULT '[]'::jsonb,
  status                 varchar(16)  NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | REVOKED | EXPIRED
  approved_by            varchar(255) NOT NULL,          -- owner del recurso
  approved_at            timestamptz  NOT NULL DEFAULT now(),
  expires_at             timestamptz,
  revoked_at             timestamptz,
  revoke_reason          text
);

CREATE UNIQUE INDEX IF NOT EXISTS resource_shares_unique
  ON resource_shares (resource_type, resource_id, shared_with_collab_id)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS resource_shares_collab_idx
  ON resource_shares (shared_with_collab_id, status);
