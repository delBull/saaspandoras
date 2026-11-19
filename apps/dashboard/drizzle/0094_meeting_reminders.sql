-- 0094_meeting_reminders.sql
-- Recordatorios de reunión (24 h y 1 h antes) con idempotencia por participante.
-- ADITIVA: dos columnas nullable; NULL = todavía no se envió.
--
-- Rollback:
--   ALTER TABLE "meeting_participants" DROP COLUMN IF EXISTS "reminder_24h_sent_at";
--   ALTER TABLE "meeting_participants" DROP COLUMN IF EXISTS "reminder_1h_sent_at";

ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "reminder_24h_sent_at" timestamptz;
ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "reminder_1h_sent_at" timestamptz;
