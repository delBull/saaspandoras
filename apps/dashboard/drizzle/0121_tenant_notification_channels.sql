-- 0121 · Canales de notificación por tenant
--
-- Cada tenant define a dónde se avisa (hoy: su canal privado de Discord vía
-- webhook). No se guarda en `projects.tenantRuntimeConfig` porque esa config se
-- devuelve completa en `/api/v1/tenant/:id/manifest`; un webhook ahí quedaría
-- expuesto. Tabla propia, tenant-scoped y auditable.
--
-- La aprobación NO se resuelve desde el canal: el aviso sólo enlaza al portal.

CREATE TABLE IF NOT EXISTS tenant_notification_channels (
  id               varchar(64)  PRIMARY KEY,
  canonical_org_id varchar(255) NOT NULL,
  kind             varchar(32)  NOT NULL DEFAULT 'approvals', -- approvals | alerts
  channel          varchar(32)  NOT NULL,                     -- discord_webhook
  target           varchar(600) NOT NULL,
  enabled          boolean      NOT NULL DEFAULT true,
  created_by       varchar(255),
  created_at       timestamp with time zone NOT NULL DEFAULT now(),
  updated_at       timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_notification_channels_uq
  ON tenant_notification_channels (canonical_org_id, kind, channel);

CREATE INDEX IF NOT EXISTS tenant_notification_channels_org_idx
  ON tenant_notification_channels (canonical_org_id, enabled);
