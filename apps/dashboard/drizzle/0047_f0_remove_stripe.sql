ALTER TABLE "transactions" ALTER COLUMN "method" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."payment_method";--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('crypto', 'wire');--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "method" SET DATA TYPE "public"."payment_method" USING "method"::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "payment_links" ALTER COLUMN "methods" SET DEFAULT '["crypto","wire"]'::jsonb;--> statement-breakpoint
ALTER TABLE "purchases" DROP COLUMN "stripe_session_id";