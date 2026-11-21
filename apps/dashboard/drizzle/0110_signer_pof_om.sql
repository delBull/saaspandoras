-- 0110 · POF (proof of funds) y entrega del OM por firmante
-- Aditiva: agrega columnas nullable a nexus_deal_signers.

ALTER TABLE "nexus_deal_signers"
  ADD COLUMN IF NOT EXISTS "pof_status" varchar(24) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "pof_verified_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "om_sent_at" timestamptz;
