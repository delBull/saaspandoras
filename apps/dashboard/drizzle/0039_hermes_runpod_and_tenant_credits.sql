CREATE TABLE IF NOT EXISTS "hermes_tenant_credits" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(128) NOT NULL,
	"credit_balance_usd" numeric(12, 4) DEFAULT '0.0000' NOT NULL,
	"total_deposited_usd" numeric(12, 4) DEFAULT '0.0000' NOT NULL,
	"total_spent_usd" numeric(12, 4) DEFAULT '0.0000' NOT NULL,
	"markup_percentage" integer DEFAULT 35 NOT NULL,
	"is_sandbox_enabled" boolean DEFAULT true NOT NULL,
	"sandbox_balance_usd" numeric(12, 4) DEFAULT '0.0000' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hermes_tenant_credits_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hermes_compute_usage_events" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(128) NOT NULL,
	"request_id" varchar(128),
	"capability" varchar(128) NOT NULL,
	"provider" varchar(64) DEFAULT 'runpod' NOT NULL,
	"endpoint_id" varchar(128),
	"execution_seconds" numeric(8, 3) DEFAULT '0.000',
	"raw_cost_usd" numeric(10, 5) DEFAULT '0.00000' NOT NULL,
	"markup_cost_usd" numeric(10, 5) DEFAULT '0.00000' NOT NULL,
	"total_charged_usd" numeric(10, 5) DEFAULT '0.00000' NOT NULL,
	"currency" varchar(16) DEFAULT 'USD',
	"status" varchar(32) DEFAULT 'SETTLED',
	"is_sandbox" boolean DEFAULT false NOT NULL,
	"metadata_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hermes_runpod_endpoints" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(128),
	"endpoint_id" varchar(128) NOT NULL,
	"endpoint_name" varchar(128) NOT NULL,
	"model_type" varchar(64) NOT NULL,
	"gpu_type" varchar(64) DEFAULT 'NVIDIA RTX A4000',
	"per_second_cost_usd" numeric(10, 6) DEFAULT '0.000350',
	"status" varchar(32) DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hermes_runpod_endpoints_endpoint_id_unique" UNIQUE("endpoint_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hermes_tenant_credits_tenant_unique" ON "hermes_tenant_credits" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_compute_events_tenant_idx" ON "hermes_compute_usage_events" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_compute_events_req_idx" ON "hermes_compute_usage_events" USING btree ("request_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hermes_runpod_endpoints_ep_unique" ON "hermes_runpod_endpoints" USING btree ("endpoint_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_runpod_endpoints_tenant_idx" ON "hermes_runpod_endpoints" USING btree ("tenant_id");
