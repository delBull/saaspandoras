-- 0118 · Datos de contacto del firmante y constancia de envío
--
-- 1) signature_phone: el formulario de firma no pedía teléfono, así que el Deal
--    Pod no podía contactar al cliente después de la firma.
-- 2) document_sent_at: deja constancia de que el documento (PDF) se envió al
--    firmante, para no reenviarlo y para poder auditar la entrega.

ALTER TABLE nexus_deal_signers
  ADD COLUMN IF NOT EXISTS signature_phone varchar(40);

ALTER TABLE nexus_deal_signers
  ADD COLUMN IF NOT EXISTS document_sent_at timestamp with time zone;
