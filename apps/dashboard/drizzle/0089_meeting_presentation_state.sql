-- 0089_meeting_presentation_state.sql
-- Estado del deck inyectado en una Sovereign Meeting.
--
-- ADITIVA Y NO DESTRUCTIVA. Además ADOPTA la tabla que ya existe en producción
-- (`meeting_presentation_state`, creada por el checkout principal) en lugar de
-- duplicar el estado en columnas de `meetings`: una sola fuente de verdad.
--
-- Rollback:
--   ALTER TABLE "meeting_presentation_state" DROP COLUMN IF EXISTS "presentation_open";

-- 1) Si la tabla no existiera (entorno nuevo), se crea completa e idempotente.
CREATE TABLE IF NOT EXISTS "meeting_presentation_state" (
  "meeting_id" text PRIMARY KEY,
  "presentation_id" text NOT NULL,
  "slide_index" integer NOT NULL DEFAULT 0,
  "presentation_open" boolean NOT NULL DEFAULT false,
  "updated_by" text,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 2) En el entorno existente solo se agrega el flag de "deck visible en la sala".
ALTER TABLE "meeting_presentation_state" ADD COLUMN IF NOT EXISTS "presentation_open" boolean NOT NULL DEFAULT false;
