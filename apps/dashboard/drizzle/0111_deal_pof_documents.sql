-- 0111 · Documentos de prueba de fondos (POF) por firmante
-- Aditiva. Guarda el archivo en Postgres (bytea) para no depender de storage externo.

CREATE TABLE IF NOT EXISTS "nexus_deal_pof_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "room_id" uuid NOT NULL REFERENCES "nexus_deal_rooms"("id") ON DELETE CASCADE,
  "signer_email" text NOT NULL,
  "filename" text NOT NULL,
  "mime_type" varchar(64) NOT NULL,
  "size_bytes" integer NOT NULL,
  "content" bytea NOT NULL,
  "entity_name" text,
  "fund_name" text,
  "amount_range" varchar(64),
  "notes" text,
  "uploaded_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_pof_room_email"
  ON "nexus_deal_pof_documents" ("room_id", "signer_email");
