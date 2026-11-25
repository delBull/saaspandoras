-- 0120 · Propuestas de comunidad (texto durable + vínculo con la aprobación)
--
-- La aprobación sólo guarda el "por qué"; sin el texto de las publicaciones,
-- aprobar no tendría qué ejecutar y se perdería la evidencia de lo aprobado.

CREATE TABLE IF NOT EXISTS community_proposals (
  id               varchar(64)  PRIMARY KEY,
  canonical_org_id varchar(255) NOT NULL,
  project_id       integer      NOT NULL,
  proposal_key     varchar(120) NOT NULL,
  intent           text,
  posts            jsonb        NOT NULL,
  approval_id      varchar(64),
  status           varchar(24)  NOT NULL DEFAULT 'PENDING',
  requested_by     varchar(255),
  created_at       timestamp with time zone NOT NULL DEFAULT now(),
  executed_at      timestamp with time zone,
  result           jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS community_proposals_org_key_uq
  ON community_proposals (canonical_org_id, proposal_key);

CREATE INDEX IF NOT EXISTS community_proposals_approval_idx
  ON community_proposals (approval_id);

CREATE INDEX IF NOT EXISTS community_proposals_status_idx
  ON community_proposals (canonical_org_id, status);
