-- 0093: suscripción mensual del tenant (separada de los créditos de media).
CREATE TABLE IF NOT EXISTS "tenant_subscriptions" (
  "tenant_id" varchar(128) PRIMARY KEY,
  "status" varchar(24) NOT NULL DEFAULT 'active',
  "amount_usd" numeric(12,2) NOT NULL DEFAULT 0,
  "currency" varchar(8) NOT NULL DEFAULT 'USD',
  "current_period_start" timestamp with time zone,
  "current_period_end" timestamp with time zone,
  "grace_ends_at" timestamp with time zone,
  "last_payment_tx" varchar(80),
  "last_paid_at" timestamp with time zone,
  "last_paid_amount_usd" numeric(12,2),
  "suspended_at" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "tenant_subscriptions_status_idx" ON "tenant_subscriptions" ("status");
CREATE INDEX IF NOT EXISTS "tenant_subscriptions_period_end_idx" ON "tenant_subscriptions" ("current_period_end");
