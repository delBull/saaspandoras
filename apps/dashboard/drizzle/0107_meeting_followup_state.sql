-- 0107 · Estado del seguimiento post-reunión (paso 3)
-- Migración ADITIVA: solo agrega columnas nullable a `meetings`. No toca datos.
-- Idempotente.

ALTER TABLE "meetings"
  ADD COLUMN IF NOT EXISTS "follow_up_stage" varchar(24),
  ADD COLUMN IF NOT EXISTS "follow_up_responded_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "follow_up_reminder_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "follow_up_reminder_sent_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "follow_up_closed_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "follow_up_close_reason" varchar(64),
  ADD COLUMN IF NOT EXISTS "follow_up_close_note" text;

-- Búsqueda del recordatorio pendiente (parcial: solo filas con fecha).
CREATE INDEX IF NOT EXISTS "idx_meetings_followup_reminder"
  ON "meetings" ("follow_up_reminder_at")
  WHERE "follow_up_reminder_at" IS NOT NULL;
