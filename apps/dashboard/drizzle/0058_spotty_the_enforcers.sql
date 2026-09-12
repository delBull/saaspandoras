CREATE TABLE "hermes_trial_credits" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(128) NOT NULL,
	"credit_type" varchar(32) DEFAULT 'MEDIA' NOT NULL,
	"granted_credits" integer DEFAULT 0 NOT NULL,
	"reserved_credits" integer DEFAULT 0 NOT NULL,
	"consumed_credits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hermes_trial_credits_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "hermes_trial_events" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(128) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"actor_id" varchar(128),
	"metadata_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "hermes_media_req_tenant_idem_idx";--> statement-breakpoint
ALTER TABLE "distribution_jobs" ADD COLUMN "reconciliation_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "distribution_jobs" ADD COLUMN "last_reconciled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "distribution_jobs" ADD COLUMN "next_reconciliation_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "distribution_jobs" ADD COLUMN "reconciliation_lock_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hermes_media_requests" ADD COLUMN "reconciliation_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "hermes_media_requests" ADD COLUMN "last_reconciled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hermes_media_requests" ADD COLUMN "next_reconciliation_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hermes_media_requests" ADD COLUMN "reconciliation_lock_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nexus_deal_rooms" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "nexus_deal_rooms" ADD COLUMN "shared_with" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tenant_type" varchar(32) DEFAULT 'PRODUCTION' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "trial_tier" varchar(32) DEFAULT 'SOFTWARE_ONLY';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "trial_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "trial_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "trial_status" varchar(32) DEFAULT 'ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_trial_credits_tenant_unique" ON "hermes_trial_credits" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "hermes_trial_events_tenant_event_idx" ON "hermes_trial_events" USING btree ("tenant_id","event_type");--> statement-breakpoint
CREATE INDEX "hermes_trial_events_created_at_idx" ON "hermes_trial_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "distribution_jobs_reconcile_idx" ON "distribution_jobs" USING btree ("status","next_reconciliation_at");--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_media_req_tenant_idem_unique" ON "hermes_media_requests" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "hermes_media_req_reconcile_idx" ON "hermes_media_requests" USING btree ("status","next_reconciliation_at");--> statement-breakpoint
CREATE INDEX "project_tenant_type_idx" ON "projects" USING btree ("tenant_type");--> statement-breakpoint
CREATE INDEX "project_trial_ends_at_idx" ON "projects" USING btree ("trial_ends_at");--> statement-breakpoint
ALTER TABLE "telegram_bindings" ADD COLUMN IF NOT EXISTS "active_organization_id" varchar(256);--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'telegram_bindings_active_organization_id_projects_slug_fk'
  ) THEN
    ALTER TABLE "telegram_bindings" ADD CONSTRAINT "telegram_bindings_active_organization_id_projects_slug_fk" 
    FOREIGN KEY ("active_organization_id") REFERENCES "public"."projects"("slug") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;