-- 0088_deal_room_presentation.sql
-- Vincula (opcionalmente) una Deal Room con un deck del catálogo soberano de
-- presentaciones. ADITIVA: columna nullable, sin backfill, sin pérdida de datos.
--
-- Rollback:
--   ALTER TABLE "nexus_deal_rooms" DROP COLUMN IF EXISTS "presentation_id";

ALTER TABLE "nexus_deal_rooms" ADD COLUMN IF NOT EXISTS "presentation_id" varchar(64);
