CREATE TYPE "public"."commercial_order_status" AS ENUM('PENDING_PAYMENT', 'PENDING_APPROVAL', 'PAID', 'PROVISIONING', 'PROVISIONED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."hermes_meeting_platform" AS ENUM('GOOGLE_MEET', 'JITSI', 'ZOOM', 'TEAMS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."meeting_action_item_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."meeting_follow_up_status" AS ENUM('pending', 'sent', 'no_action');--> statement-breakpoint
ALTER TYPE "public"."payment_inbox_status" ADD VALUE 'RECEIVED' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."payment_inbox_status" ADD VALUE 'PROCESSING' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."payment_inbox_status" ADD VALUE 'PROCESSED' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."payment_inbox_status" ADD VALUE 'FAILED_RETRYABLE' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."payment_inbox_status" ADD VALUE 'FAILED_FINAL' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."payment_inbox_status" ADD VALUE 'IGNORED' BEFORE 'pending';--> statement-breakpoint
CREATE TABLE "commercial_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_key" varchar(50) NOT NULL,
	"price_version" varchar(50) NOT NULL,
	"unit_price" numeric(18, 2) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercial_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"total_amount" numeric(18, 2) NOT NULL,
	"status" "commercial_order_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"requested_org_name" varchar(255) NOT NULL,
	"requested_org_slug" varchar(255) NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"verified_by" varchar(255),
	"verified_at" timestamp with time zone,
	"provisioned_project_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commercial_orders_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "hermes_briefing_preferences" (
	"organization_id" varchar(256) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"channel" varchar(64) DEFAULT 'EMAIL' NOT NULL,
	"lead_time_minutes" integer DEFAULT 30 NOT NULL,
	"target_emails" jsonb,
	"target_phones" jsonb,
	"include_facts" boolean DEFAULT true NOT NULL,
	"include_financials" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_briefings" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"meeting_id" varchar(128) NOT NULL,
	"channel" varchar(64) NOT NULL,
	"destination" varchar(256) NOT NULL,
	"status" varchar(64) DEFAULT 'PENDING' NOT NULL,
	"error_reason" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_meetings" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"platform" "hermes_meeting_platform" DEFAULT 'OTHER' NOT NULL,
	"join_url" varchar(1024),
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"organizer_email" varchar(256),
	"attendees" jsonb,
	"status" varchar(64) DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_action_items" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"canonical_org_id" text NOT NULL,
	"task" text NOT NULL,
	"assignee_name" text,
	"assignee_identity_id" varchar(255),
	"status" "meeting_action_item_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nft_ownership_cache" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenant_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "nft_ownership_cache" CASCADE;--> statement-breakpoint
DROP TABLE "tenant_users" CASCADE;--> statement-breakpoint
DROP TABLE "tenants" CASCADE;--> statement-breakpoint
ALTER TABLE "ambassador_clients" DROP CONSTRAINT "ambassador_clients_ambassador_id_ambassadors_id_fk";
--> statement-breakpoint
DROP INDEX "academy_assessments_org_idx";--> statement-breakpoint
DROP INDEX "academy_assessments_candidate_idx";--> statement-breakpoint
DROP INDEX "academy_assessments_status_idx";--> statement-breakpoint
DROP INDEX "academy_candidates_org_idx";--> statement-breakpoint
DROP INDEX "academy_candidates_email_idx";--> statement-breakpoint
DROP INDEX "academy_candidates_status_idx";--> statement-breakpoint
DROP INDEX "academy_certifications_org_idx";--> statement-breakpoint
DROP INDEX "academy_certifications_candidate_idx";--> statement-breakpoint
DROP INDEX "academy_certifications_assessment_idx";--> statement-breakpoint
DROP INDEX "academy_certifications_ipfs_cid_idx";--> statement-breakpoint
DROP INDEX "academy_invitations_org_idx";--> statement-breakpoint
DROP INDEX "academy_invitations_candidate_idx";--> statement-breakpoint
DROP INDEX "academy_invitations_status_idx";--> statement-breakpoint
DROP INDEX "ambassador_clients_amb_idx";--> statement-breakpoint
DROP INDEX "ambassador_commissions_txhash_idx";--> statement-breakpoint
DROP INDEX "ambassador_commissions_amb_idx";--> statement-breakpoint
DROP INDEX "ambassador_commissions_status_idx";--> statement-breakpoint
DROP INDEX "audit_logs_address_idx";--> statement-breakpoint
DROP INDEX "audit_logs_tenant_idx";--> statement-breakpoint
DROP INDEX "audit_logs_event_idx";--> statement-breakpoint
DROP INDEX "audit_logs_created_idx";--> statement-breakpoint
DROP INDEX "auth_challenges_address_idx";--> statement-breakpoint
DROP INDEX "channel_external_user_unique";--> statement-breakpoint
DROP INDEX "cib_identity_idx";--> statement-breakpoint
DROP INDEX "channel_outbox_idempotency_unique";--> statement-breakpoint
DROP INDEX "channel_outbox_status_idx";--> statement-breakpoint
DROP INDEX "contact_doctrine_seals_lead_version_uq";--> statement-breakpoint
DROP INDEX "contact_doctrine_seals_lead_idx";--> statement-breakpoint
DROP INDEX "unique_course_enrollment";--> statement-breakpoint
DROP INDEX "unique_project_member";--> statement-breakpoint
DROP INDEX "dao_member_project_idx";--> statement-breakpoint
DROP INDEX "dao_member_wallet_idx";--> statement-breakpoint
DROP INDEX "dao_treasury_snapshot_project_token_idx";--> statement-breakpoint
DROP INDEX "deal_envelopes_org_status_idx";--> statement-breakpoint
DROP INDEX "deal_envelopes_doc_hash_idx";--> statement-breakpoint
DROP INDEX "distribution_attempts_job_attempt_idx";--> statement-breakpoint
DROP INDEX "distribution_attempts_tenant_provider_idx";--> statement-breakpoint
DROP INDEX "distribution_attempts_execution_id_idx";--> statement-breakpoint
DROP INDEX "distribution_jobs_tenant_idempotency_uq";--> statement-breakpoint
DROP INDEX "distribution_jobs_tenant_status_idx";--> statement-breakpoint
DROP INDEX "distribution_jobs_campaign_piece_idx";--> statement-breakpoint
DROP INDEX "distribution_jobs_reconcile_idx";--> statement-breakpoint
DROP INDEX "email_metrics_email_id_idx";--> statement-breakpoint
DROP INDEX "marketing_leads_project_identity_idx";--> statement-breakpoint
DROP INDEX "marketing_leads_is_deleted_idx";--> statement-breakpoint
DROP INDEX "partner_certifications_amb_idx";--> statement-breakpoint
DROP INDEX "partner_reputation_events_amb_idx";--> statement-breakpoint
DROP INDEX "project_slug_index";--> statement-breakpoint
DROP INDEX "project_is_deleted_index";--> statement-breakpoint
DROP INDEX "project_tenant_type_idx";--> statement-breakpoint
DROP INDEX "project_trial_ends_at_idx";--> statement-breakpoint
ALTER TABLE "payment_inbox_events" ALTER COLUMN "status" SET DEFAULT 'RECEIVED';--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD COLUMN "follow_up_status" "meeting_follow_up_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "jitsi_room_id" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "presentation_id" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "ai_summary" text;--> statement-breakpoint
ALTER TABLE "payment_inbox_events" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_inbox_events" ADD COLUMN "lease_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_inbox_events" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_inbox_events" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "payment_inbox_events" ADD COLUMN "next_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commercial_order_lines" ADD CONSTRAINT "commercial_order_lines_order_id_commercial_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."commercial_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_orders" ADD CONSTRAINT "commercial_orders_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_orders" ADD CONSTRAINT "commercial_orders_provisioned_project_id_projects_id_fk" FOREIGN KEY ("provisioned_project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_orders_active_idx" ON "commercial_orders" USING btree ("lead_id") WHERE status IN ('PENDING_PAYMENT', 'PENDING_APPROVAL', 'PAID', 'PROVISIONING');--> statement-breakpoint
CREATE INDEX "payment_inbox_retry_idx" ON "payment_inbox_events" USING btree ("status","next_attempt_at");--> statement-breakpoint
ALTER TABLE "deal_envelopes" DROP COLUMN "preservation_evidence";--> statement-breakpoint
ALTER TABLE "payment_inbox_events" DROP COLUMN "error";