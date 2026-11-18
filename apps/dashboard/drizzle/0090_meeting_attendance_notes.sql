-- 0090_meeting_attendance_notes.sql
-- Cierra dos gaps del ciclo de presentación:
--   1. ASISTENCIA: token de unión por participante (el link del email identifica a quién entró).
--   2. GUION CONTEXTUAL: notas del presentador por reunión (ajuste para esta sesión concreta).
-- ADITIVA: columnas nullable, sin backfill, sin pérdida de datos.
--
-- Rollback:
--   DROP INDEX IF EXISTS "meeting_participants_join_token_idx";
--   ALTER TABLE "meeting_participants" DROP COLUMN IF EXISTS "join_token";
--   ALTER TABLE "meetings" DROP COLUMN IF EXISTS "presenter_notes";

ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "join_token" varchar(64);
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_participants_join_token_idx"
  ON "meeting_participants" ("join_token") WHERE "join_token" IS NOT NULL;

ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "presenter_notes" text;
