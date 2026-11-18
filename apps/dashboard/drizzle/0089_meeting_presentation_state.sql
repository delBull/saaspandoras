-- 0089_meeting_presentation_state.sql
-- Estado compartido de la presentación inyectada en una Sovereign Meeting.
-- ADITIVA: dos columnas con DEFAULT, sin backfill destructivo. Las filas existentes
-- quedan como "presentación cerrada, slide 0".
--
-- Rollback:
--   ALTER TABLE "meetings" DROP COLUMN IF EXISTS "presentation_open";
--   ALTER TABLE "meetings" DROP COLUMN IF EXISTS "presentation_slide";

ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "presentation_open" boolean NOT NULL DEFAULT false;
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "presentation_slide" integer NOT NULL DEFAULT 0;
