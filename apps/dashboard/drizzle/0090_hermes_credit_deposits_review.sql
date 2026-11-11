-- 0090: revisión de depósitos (aprobación semiautomática por admin).
--
-- Aditivo y compatible hacia atrás:
--   * Las filas históricas ya estaban acreditadas → `status = 'credited'` por default.
--   * `pending` reserva el txHash (índice único) sin abonar saldo.
--
-- Invariante: sólo `TenantBillingService.processDeposit` muta el saldo, y sólo
-- después de que un admin marque el depósito como `credited`.

ALTER TABLE "hermes_credit_deposits"
  ADD COLUMN IF NOT EXISTS "status" varchar(24) NOT NULL DEFAULT 'credited';

ALTER TABLE "hermes_credit_deposits"
  ADD COLUMN IF NOT EXISTS "reviewed_by" varchar(160);

ALTER TABLE "hermes_credit_deposits"
  ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;

ALTER TABLE "hermes_credit_deposits"
  ADD COLUMN IF NOT EXISTS "rejection_reason" text;

CREATE INDEX IF NOT EXISTS "hermes_credit_deposits_status_idx"
  ON "hermes_credit_deposits" ("status");

-- Backfill explícito (documenta la intención sobre datos existentes).
UPDATE "hermes_credit_deposits"
   SET "status" = 'credited'
 WHERE "status" IS NULL;
