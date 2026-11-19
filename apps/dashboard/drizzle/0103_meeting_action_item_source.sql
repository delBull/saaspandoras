-- 0103_meeting_action_item_source.sql
-- Separa las tareas manuales (Minuta) de las generadas por IA al procesar audio.
-- ADITIVA: default 'manual' para no borrar tareas existentes al reprocesar.
--
-- Rollback:
--   ALTER TABLE "meeting_action_items" DROP CONSTRAINT IF EXISTS "meeting_action_items_source_chk";
--   ALTER TABLE "meeting_action_items" DROP COLUMN IF EXISTS "source";

ALTER TABLE "meeting_action_items" ADD COLUMN IF NOT EXISTS "source" varchar(16) NOT NULL DEFAULT 'manual';

DO $$ BEGIN
  ALTER TABLE "meeting_action_items"
    ADD CONSTRAINT "meeting_action_items_source_chk" CHECK ("source" IN ('manual', 'ai'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
