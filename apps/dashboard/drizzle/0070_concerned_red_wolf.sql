CREATE TABLE "private_payment_links" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"amount" numeric(18, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"destination_wallet" varchar(42) NOT NULL,
	"network_chain_id" integer DEFAULT 8453 NOT NULL,
	"settlement_token" varchar(42),
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "private_payment_links_status_idx" ON "private_payment_links" USING btree ("status");--> statement-breakpoint
CREATE INDEX "private_payment_links_created_idx" ON "private_payment_links" USING btree ("created_at");