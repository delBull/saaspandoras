-- Depósitos de saldo por tenant, con idempotencia estricta por txHash.
-- Un mismo pago on-chain no puede acreditarse dos veces (índice único global).
CREATE TABLE IF NOT EXISTS "hermes_credit_deposits" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "tenant_id" varchar(128) NOT NULL,
  "amount_usd" numeric(12, 4) NOT NULL,
  "is_sandbox" boolean DEFAULT false NOT NULL,
  "chain_id" integer,
  "token_address" varchar(42),
  "tx_hash" varchar(80) NOT NULL,
  "from_address" varchar(42),
  "to_address" varchar(42),
  "block_number" varchar(32),
  "credited_by" varchar(160) NOT NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hermes_credit_deposits_tx_unique" ON "hermes_credit_deposits" USING btree ("tx_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_credit_deposits_tenant_idx" ON "hermes_credit_deposits" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_credit_deposits_created_idx" ON "hermes_credit_deposits" USING btree ("created_at");
