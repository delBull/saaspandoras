-- 0126 · Archivar salas sin borrarlas
--
-- La consola listaba salas demo/prueba junto a las reales. `nexus_deal_pods` ya
-- tenía archived_at; las salas no. Se agrega para poder ocultarlas del listado
-- sin perder la evidencia (la sala sigue accesible por su enlace público).

ALTER TABLE nexus_deal_rooms
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS nexus_deal_rooms_archived_idx
  ON nexus_deal_rooms (archived_at)
  WHERE archived_at IS NULL;
