-- 0127 · Identidad de agente por colaborador (ADR-021, fases 1-2)
--
-- Un colaborador opera con su propia IA: credencial propia, delegación acotada,
-- expiración y candados. Nada de compartir la identidad del owner.
--
-- Invariantes:
--  * La delegación es intersección con los permisos efectivos del colaborador.
--  * Sólo un admin aprueba; aprobar no crea permisos nuevos, sólo activa el uso.
--  * Revocar la clave mata sus delegaciones (on delete cascade).
--  * Todos los topes son explícitos y con default restrictivo.

CREATE TABLE IF NOT EXISTS agent_keys (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id    integer NOT NULL,
  canonical_org_id   varchar(256) NOT NULL DEFAULT 'pandoras',
  label              varchar(120) NOT NULL,
  key_prefix         varchar(24)  NOT NULL,
  key_hash           varchar(64)  NOT NULL UNIQUE,
  status             varchar(16)  NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | SUSPENDED | REVOKED
  expires_at         timestamptz  NOT NULL,
  last_used_at       timestamptz,
  created_by         varchar(255) NOT NULL,
  created_at         timestamptz  NOT NULL DEFAULT now(),
  revoked_at         timestamptz,
  revoke_reason      text
);

CREATE INDEX IF NOT EXISTS agent_keys_collab_idx ON agent_keys (collaborator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_keys_status_idx ON agent_keys (status);

CREATE TABLE IF NOT EXISTS agent_delegations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key_id    uuid NOT NULL REFERENCES agent_keys(id) ON DELETE CASCADE,
  collaborator_id integer NOT NULL,
  capabilities    jsonb NOT NULL DEFAULT '[]'::jsonb,   -- módulos concedidos
  scope           jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { pods: [], rooms: [], projects: [] }
  status          varchar(16) NOT NULL DEFAULT 'PENDING', -- PENDING | ACTIVE | SUSPENDED | REVOKED
  requested_by    varchar(255) NOT NULL,
  approved_by     varchar(255),
  approved_at     timestamptz,
  expires_at      timestamptz NOT NULL,
  revoked_at      timestamptz,
  revoke_reason   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_delegations_key_idx ON agent_delegations (agent_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_delegations_status_idx ON agent_delegations (status);

CREATE TABLE IF NOT EXISTS agent_limits (
  agent_key_id                   uuid PRIMARY KEY REFERENCES agent_keys(id) ON DELETE CASCADE,
  max_mutations_per_hour         integer NOT NULL DEFAULT 60,
  max_outbound_messages_per_day  integer NOT NULL DEFAULT 50,
  require_approval_for           jsonb NOT NULL DEFAULT '["deal.sign","payment.*","publish.*"]'::jsonb,
  auto_suspend_on_anomaly        boolean NOT NULL DEFAULT true,
  updated_at                     timestamptz NOT NULL DEFAULT now()
);
