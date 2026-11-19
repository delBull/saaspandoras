-- 0105_meeting_archive.sql
-- Borrado lógico de reuniones pasadas desde la agenda del host.
-- ADITIVA: la reunión, minuta, asistencia y follow-ups se conservan.
--
-- Rollback:
--   DROP INDEX IF EXISTS "meetings_archived_at_idx";
--   ALTER TABLE "meetings" DROP COLUMN IF EXISTS "archived_at";

ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "archived_at" timestamptz;
CREATE INDEX IF NOT EXISTS "meetings_archived_at_idx" ON "meetings" ("archived_at");
