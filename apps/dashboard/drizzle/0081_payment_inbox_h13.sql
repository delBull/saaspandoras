ALTER TYPE "payment_inbox_status" ADD VALUE IF NOT EXISTS 'RECEIVED';
ALTER TYPE "payment_inbox_status" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "payment_inbox_status" ADD VALUE IF NOT EXISTS 'PROCESSED';
ALTER TYPE "payment_inbox_status" ADD VALUE IF NOT EXISTS 'FAILED_RETRYABLE';
ALTER TYPE "payment_inbox_status" ADD VALUE IF NOT EXISTS 'FAILED_FINAL';
ALTER TYPE "payment_inbox_status" ADD VALUE IF NOT EXISTS 'IGNORED';

ALTER TABLE "payment_inbox_events" ALTER COLUMN "status" SET DEFAULT 'RECEIVED';

ALTER TABLE "payment_inbox_events" ADD COLUMN IF NOT EXISTS "claimed_at" timestamp with time zone;
ALTER TABLE "payment_inbox_events" ADD COLUMN IF NOT EXISTS "lease_expires_at" timestamp with time zone;
ALTER TABLE "payment_inbox_events" ADD COLUMN IF NOT EXISTS "attempt_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "payment_inbox_events" ADD COLUMN IF NOT EXISTS "last_error" text;
ALTER TABLE "payment_inbox_events" ADD COLUMN IF NOT EXISTS "next_attempt_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "payment_inbox_retry_idx" ON "payment_inbox_events" USING btree ("status", "next_attempt_at");
