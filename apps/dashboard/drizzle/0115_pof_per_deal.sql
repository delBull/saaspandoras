-- 0115 · Prueba de fondos (POF) por deal
-- Aditiva. La POF deja de ser global: se activa al crear la sala, sólo para los
-- tratos que la requieren (p. ej. compra de activo). Si está en false, el OM se
-- libera con el NDA firmado.

ALTER TABLE "nexus_deal_rooms"
  ADD COLUMN IF NOT EXISTS "pof_enabled" boolean NOT NULL DEFAULT false;

-- El deal de Village es una compra de activo en operación: sí requiere POF.
UPDATE "nexus_deal_rooms"
   SET "pof_enabled" = true,
       "updated_at" = now()
 WHERE "public_id" = 'PDR-VILLAGE'
   AND "pof_enabled" = false;
