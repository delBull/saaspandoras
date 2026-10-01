CREATE TYPE "public"."payment_inbox_status" AS ENUM('pending', 'processed', 'failed', 'ignored');--> statement-breakpoint
CREATE TABLE "payment_inbox_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"payment_intent_id" varchar(255),
	"payload" jsonb NOT NULL,
	"status" "payment_inbox_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "payment_inbox_intent_idx" ON "payment_inbox_events" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE INDEX "payment_inbox_provider_status_idx" ON "payment_inbox_events" USING btree ("provider","status");