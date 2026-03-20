ALTER TABLE "email_metrics" ADD COLUMN "delivered_at" timestamp with time zone;
ALTER TABLE "email_metrics" ADD COLUMN "bounced_at" timestamp with time zone;
