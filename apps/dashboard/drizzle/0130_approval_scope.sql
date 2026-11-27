-- 0130 · Ámbito de las aprobaciones (ADR-020 / opción A)
--
-- La tabla nexus_approvals es un ledger compartido, pero hasta hoy no distinguía
-- de qué mundo venía cada aprobación. Eso mezclaba operación interna de Pandora's
-- con operación propia del tenant (media/redes de S'Narai).
--
--   internal → accesos, agentes, deal pods (Nexus)
--   tenant   → media y publicaciones del tenant (Growth OS del tenant)
--   deal     → NDA, POF, entrega del OM (contexto del deal pod)

ALTER TABLE nexus_approvals
  ADD COLUMN IF NOT EXISTS scope varchar(16) NOT NULL DEFAULT 'internal';

-- Backfill: las propuestas de comunidad ya son del tenant.
UPDATE nexus_approvals
   SET scope = 'tenant'
 WHERE scope = 'internal'
   AND what LIKE 'community.publish_post:%';

CREATE INDEX IF NOT EXISTS nexus_approvals_scope_idx
  ON nexus_approvals (canonical_org_id, scope, status);
