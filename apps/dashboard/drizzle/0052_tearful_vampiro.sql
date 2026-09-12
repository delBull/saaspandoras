CREATE TABLE "contact_doctrine_seals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"cid" varchar(128) NOT NULL,
	"ipfs_uri" varchar(160),
	"content_hash" varchar(64) NOT NULL,
	"contact_ref" varchar(64) NOT NULL,
	"hmac_signature" varchar(128),
	"agent_signature" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"integrity" boolean DEFAULT false NOT NULL,
	"pending_replica" boolean DEFAULT true NOT NULL,
	"provider" varchar(32),
	"sealed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distribution_execution_attempts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"job_id" varchar(36) NOT NULL,
	"tenant_id" varchar(128) NOT NULL,
	"attempt_number" integer NOT NULL,
	"provider" varchar(32) NOT NULL,
	"execution_id" varchar(255),
	"status" varchar(32) DEFAULT 'DISPATCHING' NOT NULL,
	"lease_expires_at" timestamp with time zone,
	"receipt" jsonb,
	"error_code" varchar(64),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distribution_jobs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(128) NOT NULL,
	"campaign_id" varchar(128) NOT NULL,
	"piece_id" varchar(128) NOT NULL,
	"channel" varchar(32) NOT NULL,
	"integration_id" varchar(36),
	"idempotency_key" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"payload" jsonb NOT NULL,
	"primary_provider" varchar(32) DEFAULT 'SOFIA' NOT NULL,
	"active_attempt_id" varchar(36),
	"active_provider" varchar(32),
	"receipt" jsonb,
	"reconciliation_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_generation_attempts" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"request_id" varchar(128) NOT NULL,
	"tenant_id" varchar(128) NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"provider" varchar(64) NOT NULL,
	"execution_id" varchar(128),
	"status" varchar(32) DEFAULT 'DISPATCHING' NOT NULL,
	"compute_seconds" numeric(8, 3) DEFAULT '0.000',
	"raw_cost_usd" numeric(10, 5) DEFAULT '0.00000',
	"markup_cost_usd" numeric(10, 5) DEFAULT '0.00000',
	"total_charged_usd" numeric(10, 5) DEFAULT '0.00000',
	"artifact_id" varchar(128),
	"error_code" varchar(64),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_social_integrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(128) NOT NULL,
	"channel" varchar(32) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_handle" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'CONNECTED' NOT NULL,
	"supported_capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"encrypted_payload" jsonb,
	"credential_fingerprint" varchar(64),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"last_verified_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hermes_media_requests" ADD COLUMN "idempotency_key" varchar(256);--> statement-breakpoint
ALTER TABLE "hermes_tenant_credits" ADD COLUMN "reserved_balance_usd" numeric(12, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "hermes_tenant_credits" ADD COLUMN "sandbox_reserved_balance_usd" numeric(12, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_doctrine_seals" ADD CONSTRAINT "contact_doctrine_seals_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_execution_attempts" ADD CONSTRAINT "distribution_execution_attempts_job_id_distribution_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."distribution_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_generation_attempts" ADD CONSTRAINT "hermes_generation_attempts_request_id_hermes_media_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."hermes_media_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contact_doctrine_seals_lead_version_uq" ON "contact_doctrine_seals" USING btree ("lead_id","version");--> statement-breakpoint
CREATE INDEX "contact_doctrine_seals_lead_idx" ON "contact_doctrine_seals" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "distribution_attempts_job_attempt_idx" ON "distribution_execution_attempts" USING btree ("job_id","attempt_number");--> statement-breakpoint
CREATE INDEX "distribution_attempts_tenant_provider_idx" ON "distribution_execution_attempts" USING btree ("tenant_id","provider");--> statement-breakpoint
CREATE INDEX "distribution_attempts_execution_id_idx" ON "distribution_execution_attempts" USING btree ("execution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "distribution_jobs_tenant_idempotency_uq" ON "distribution_jobs" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "distribution_jobs_tenant_status_idx" ON "distribution_jobs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "distribution_jobs_campaign_piece_idx" ON "distribution_jobs" USING btree ("campaign_id","piece_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_gen_attempt_req_num_idx" ON "hermes_generation_attempts" USING btree ("request_id","attempt_number");--> statement-breakpoint
CREATE INDEX "hermes_gen_attempt_tenant_idx" ON "hermes_generation_attempts" USING btree ("tenant_id","request_id");--> statement-breakpoint
CREATE INDEX "tenant_social_integrations_tenant_channel_idx" ON "tenant_social_integrations" USING btree ("tenant_id","channel");--> statement-breakpoint
CREATE INDEX "tenant_social_integrations_tenant_status_idx" ON "tenant_social_integrations" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "hermes_media_req_tenant_idem_idx" ON "hermes_media_requests" USING btree ("tenant_id","idempotency_key");