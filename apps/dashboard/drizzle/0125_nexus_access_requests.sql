-- 0125 · Solicitudes de acceso a módulos de Nexus
--
-- Antes el botón "solicitar acceso" sólo mandaba un webhook a Discord: no quedaba
-- registro, así que no había nada que aprobar. Esta tabla es la bandeja única de
-- solicitudes para todos los módulos (Developer Hub, Deal Rooms, Settings, ...).
--
-- Aprobarla otorga el permiso del módulo al colaborador (nexus_collaborators.permissions).

CREATE TABLE IF NOT EXISTS nexus_access_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id integer NOT NULL,
  email           varchar(255) NOT NULL,
  name            varchar(255) NOT NULL,
  role            varchar(32)  NOT NULL DEFAULT 'COLLABORATOR',
  module          varchar(64)  NOT NULL,
  message         text,
  status          varchar(16)  NOT NULL DEFAULT 'PENDING',
  requested_at    timestamptz  NOT NULL DEFAULT now(),
  decided_at      timestamptz,
  decided_by      varchar(255),
  decision_note   text
);

-- Una sola solicitud pendiente por persona y módulo (reintentar no duplica).
CREATE UNIQUE INDEX IF NOT EXISTS nexus_access_requests_pending_uq
  ON nexus_access_requests (email, module)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS nexus_access_requests_status_idx
  ON nexus_access_requests (status, requested_at DESC);

CREATE INDEX IF NOT EXISTS nexus_access_requests_collab_idx
  ON nexus_access_requests (collaborator_id, requested_at DESC);
