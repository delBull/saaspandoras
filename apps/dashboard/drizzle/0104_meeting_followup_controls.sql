-- 0104_meeting_followup_controls.sql
-- Hace OPCIONAL el correo automático de cortesía y separa el envío del resumen.
-- ADITIVA: el default true conserva el comportamiento actual; el resumen se
-- rastrea por participante para no duplicar envíos.
--
-- Rollback:
--   ALTER TABLE "meetings" DROP COLUMN IF EXISTS "follow_up_enabled";
--   ALTER TABLE "meeting_participants" DROP COLUMN IF EXISTS "summary_sent_at";

ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "follow_up_enabled" boolean NOT NULL DEFAULT true;
ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "summary_sent_at" timestamptz;
