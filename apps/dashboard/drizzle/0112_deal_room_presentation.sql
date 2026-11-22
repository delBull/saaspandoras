-- 0112 · `nexus_deal_rooms.presentation_id`
-- Columna que faltaba en snapshots anteriores a la integración de decks.
-- Aditiva y nullable.

ALTER TABLE "nexus_deal_rooms"
  ADD COLUMN IF NOT EXISTS "presentation_id" varchar(64);
