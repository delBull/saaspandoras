CREATE TABLE "channel_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"type" varchar(255) NOT NULL,
	"channel" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"correlation_id" varchar(255) NOT NULL,
	"target_address" varchar(255),
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "channel_outbox_idempotency_unique" ON "channel_outbox" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "channel_outbox_status_idx" ON "channel_outbox" USING btree ("status");