-- 0124 · Registro de mensajes directos por red (ADR-020 §2.4-bis)
--
-- Meta permite **una** respuesta privada por comentario y no acepta repetirla.
-- El índice único es la garantía: si llega el mismo evento dos veces (reintento
-- de Meta, cold start, dos instancias), sólo una envía el DM.

CREATE TABLE IF NOT EXISTS social_dm_log (
  id               varchar(64)  PRIMARY KEY,
  canonical_org_id varchar(255) NOT NULL,
  network          varchar(32)  NOT NULL,             -- instagram | facebook | ...
  external_id      varchar(255) NOT NULL,             -- comment_id o message_id
  kind             varchar(32)  NOT NULL,             -- comment | message
  status           varchar(24)  NOT NULL,             -- SENT | SKIPPED_NO_KEYWORD | SKIPPED_NO_TENANT | FAILED
  detail           text,
  created_at       timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS social_dm_log_external_uq
  ON social_dm_log (network, external_id);

CREATE INDEX IF NOT EXISTS social_dm_log_org_idx
  ON social_dm_log (canonical_org_id, created_at DESC);
