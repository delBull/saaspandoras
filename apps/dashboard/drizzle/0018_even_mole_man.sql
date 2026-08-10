CREATE TABLE "execution_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"mission_id" varchar(255) NOT NULL,
	"intent_id" varchar(255) NOT NULL,
	"capability_id" varchar(255) NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"state" varchar(20) DEFAULT 'QUEUED' NOT NULL,
	"result" jsonb,
	"error" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "exec_records_org_idx" ON "execution_records" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "exec_records_intent_idx" ON "execution_records" USING btree ("intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exec_records_idempotency_idx" ON "execution_records" USING btree ("organization_id","capability_id","idempotency_key");