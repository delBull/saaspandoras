-- 0108 · Enlace del Deal Room con el cliente (CRM)
-- Aditiva: agrega una columna nullable con FK a `clients`. No toca datos existentes.

ALTER TABLE "nexus_deal_rooms"
  ADD COLUMN IF NOT EXISTS "client_id" text REFERENCES "clients"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_nexus_deal_rooms_client"
  ON "nexus_deal_rooms" ("client_id");
