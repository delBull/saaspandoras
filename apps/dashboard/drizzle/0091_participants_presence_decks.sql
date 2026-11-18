-- 0091_participants_presence_decks.sql
-- Tres cambios ADITIVOS que cierran los gaps de la reunión:
--   1. PARTICIPANTES ≠ FIRMANTES: email propio por participante y lista explícita.
--   2. REUNIÓN → DEAL: el meeting conoce su Deal Room (link de propuesta dinámico).
--   3. PERMANENCIA REAL: sesiones de presencia con duración por participante.
--   4. DECKS COMO DATO (CMS): presentaciones y slides en base de datos.
-- Nada se elimina ni se reescribe; todas las columnas nuevas son nullable o con DEFAULT.
--
-- Rollback:
--   DROP TABLE IF EXISTS "nexus_presentations";
--   DROP TABLE IF EXISTS "meeting_presence_sessions";
--   ALTER TABLE "meeting_participants" DROP COLUMN IF EXISTS "email";
--   ALTER TABLE "meetings" DROP COLUMN IF EXISTS "deal_room_id";

ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "deal_room_id" uuid;
ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "email" varchar(255);

CREATE TABLE IF NOT EXISTS "meeting_presence_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "meeting_id" text NOT NULL REFERENCES "meetings"("id") ON DELETE CASCADE,
  "participant_id" text,
  "identity" text NOT NULL,
  "joined_at" timestamptz NOT NULL DEFAULT now(),
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  "left_at" timestamptz,
  "source" varchar(32) NOT NULL DEFAULT 'client'
);
CREATE INDEX IF NOT EXISTS "meeting_presence_sessions_meeting_idx"
  ON "meeting_presence_sessions" ("meeting_id", "joined_at" DESC);

CREATE TABLE IF NOT EXISTS "nexus_presentations" (
  "slug" varchar(64) PRIMARY KEY,
  "title" text NOT NULL,
  "subtitle" text,
  "category" varchar(128),
  "status" varchar(32) NOT NULL DEFAULT 'DRAFT',
  "target_minutes" integer NOT NULL DEFAULT 30,
  "proposal_key" varchar(64),
  "guardrails" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "slides" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
