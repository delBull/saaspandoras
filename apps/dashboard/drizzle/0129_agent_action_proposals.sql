-- 0129 · Propuestas de agente (ADR-021: escritura gobernada)
--
-- El agente NO ejecuta mutaciones: **propone**. Un humano aprueba o rechaza.
-- Así el agente nunca es un bypass de la autorización, y cada propuesta queda
-- con su clave, su delegación y su resultado.
--
-- El conteo por hora sobre esta tabla es el límite operativo de la fase 5.

CREATE TABLE IF NOT EXISTS agent_action_proposals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key_id     uuid NOT NULL REFERENCES agent_keys(id) ON DELETE CASCADE,
  delegation_id    uuid,
  collaborator_id  integer NOT NULL,
  action           varchar(64)  NOT NULL,          -- deal.update_status | pod.add_contact | ...
  resource_type    varchar(24)  NOT NULL,          -- pod | room | project
  resource_id      varchar(128) NOT NULL,
  payload          jsonb        NOT NULL DEFAULT '{}'::jsonb,
  status           varchar(16)  NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED | EXPIRED
  proposed_by      varchar(255) NOT NULL,          -- etiqueta de la clave
  decided_by       varchar(255),
  decided_at       timestamptz,
  decision_note    text,
  created_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_action_proposals_status_idx
  ON agent_action_proposals (status, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_action_proposals_key_idx
  ON agent_action_proposals (agent_key_id, created_at DESC);
