CREATE TYPE "public"."campaign_scope" AS ENUM('b2b', 'b2c');--> statement-breakpoint
CREATE TYPE "public"."campaign_source" AS ENUM('whatsapp', 'demand_engine', 'manual');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('protocol_acquisition', 'user_acquisition');--> statement-breakpoint
CREATE TYPE "public"."marketing_lead_quality" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."marketing_lead_scope" AS ENUM('b2b', 'b2c');--> statement-breakpoint
CREATE TYPE "public"."owner_context" AS ENUM('pandora', 'client');--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'no_show';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'completed';--> statement-breakpoint
ALTER TYPE "public"."client_status" ADD VALUE 'archived';--> statement-breakpoint
ALTER TYPE "public"."client_status" ADD VALUE 'nurturing';--> statement-breakpoint
ALTER TYPE "public"."marketing_lead_status" ADD VALUE 'scheduled';--> statement-breakpoint
ALTER TYPE "public"."marketing_lead_status" ADD VALUE 'no_show';--> statement-breakpoint
ALTER TYPE "public"."marketing_lead_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."marketing_lead_status" ADD VALUE 'archived';--> statement-breakpoint
ALTER TYPE "public"."marketing_lead_status" ADD VALUE 'nurturing';--> statement-breakpoint
CREATE TABLE "access_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"wallet_address" varchar(100),
	"intent" varchar(100),
	"source" varchar(100) DEFAULT 'landing_v2',
	"status" varchar(50) DEFAULT 'pending',
	"score" integer DEFAULT 50 NOT NULL,
	"eligible_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by" varchar(42),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_stats" (
	"campaign_id" uuid PRIMARY KEY NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"leads" integer DEFAULT 0 NOT NULL,
	"purchases" integer DEFAULT 0 NOT NULL,
	"revenue" numeric(18, 2) DEFAULT '0' NOT NULL,
	"score" numeric(5, 1) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"draft_id" uuid,
	"owner_context" "owner_context" DEFAULT 'client' NOT NULL,
	"campaign_type" "campaign_type" DEFAULT 'user_acquisition' NOT NULL,
	"scope" "campaign_scope" DEFAULT 'b2c' NOT NULL,
	"name" varchar(255) NOT NULL,
	"source" "campaign_source" DEFAULT 'manual' NOT NULL,
	"type" varchar(50) DEFAULT 'conversion' NOT NULL,
	"platform" varchar(50),
	"status" "campaign_status" DEFAULT 'active' NOT NULL,
	"budget" numeric(18, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dao_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"wallet" varchar(42) NOT NULL,
	"voting_power" numeric(18, 6) DEFAULT '0.000000' NOT NULL,
	"artifacts_count" integer DEFAULT 0 NOT NULL,
	"source_campaign_id" integer,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dao_treasury" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"native_balance" numeric(18, 6) DEFAULT '0.000000' NOT NULL,
	"usdc_balance" numeric(18, 6) DEFAULT '0.000000' NOT NULL,
	"pbox_balance" numeric(18, 6) DEFAULT '0.000000' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dao_treasury_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "dao_treasury_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"token" varchar(50) NOT NULL,
	"balance" numeric(18, 6) NOT NULL,
	"usd_value" numeric(18, 6),
	"block_number" bigint,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demand_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"hook" text NOT NULL,
	"script" text NOT NULL,
	"cta" text NOT NULL,
	"full_content" text NOT NULL,
	"angle" varchar(100),
	"emotion" varchar(100),
	"mechanism" varchar(255),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demand_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"value" numeric(18, 2),
	"source" varchar(50) DEFAULT 'shortlink' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_actions_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"rule_id" varchar(100) NOT NULL,
	"rule_condition" text,
	"action_type" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"input_snapshot" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"execution_time_ms" integer
);
--> statement-breakpoint
CREATE TABLE "marketing_attribution_touches" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" uuid NOT NULL,
	"campaign_id" uuid,
	"touch_type" varchar(100) NOT NULL,
	"weight" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"fingerprint" varchar(255),
	"wallet_address" varchar(42),
	"email" varchar(255),
	"telegram_id" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "marketing_leads_project_email_idx";--> statement-breakpoint
ALTER TABLE "email_metrics" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "email_metrics" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "marketing_leads" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "gamification_events" ADD COLUMN "dedup_id" varchar(255);--> statement-breakpoint
ALTER TABLE "marketing_lead_events" ADD COLUMN "semantic_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "owner_context" "owner_context" DEFAULT 'client' NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "scope" "marketing_lead_scope" DEFAULT 'b2c' NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "identity_id" uuid;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "lead_type" varchar(100) DEFAULT 'user_prospect';--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "quality" "marketing_lead_quality" DEFAULT 'low' NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "conversion_value" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "probability" integer;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "expected_close_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "last_action" varchar(100);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "discord_webhook_url" text;--> statement-breakpoint
ALTER TABLE "scheduling_slots" ADD COLUMN "reserved_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "scheduling_slots" ADD COLUMN "reserved_by" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "access_cohort" varchar(50) DEFAULT 'public';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "benefits_tier" varchar(50) DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "access_granted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_stats" ADD CONSTRAINT "campaign_stats_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_draft_id_demand_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."demand_drafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_members" ADD CONSTRAINT "dao_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_members" ADD CONSTRAINT "dao_members_source_campaign_id_campaigns_id_fk" FOREIGN KEY ("source_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_treasury" ADD CONSTRAINT "dao_treasury_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_treasury_snapshots" ADD CONSTRAINT "dao_treasury_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_drafts" ADD CONSTRAINT "demand_drafts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_events" ADD CONSTRAINT "demand_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_actions_log" ADD CONSTRAINT "growth_actions_log_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_attribution_touches" ADD CONSTRAINT "marketing_attribution_touches_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_attribution_touches" ADD CONSTRAINT "marketing_attribution_touches_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_identities" ADD CONSTRAINT "marketing_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_member" ON "dao_members" USING btree ("project_id","wallet");--> statement-breakpoint
CREATE INDEX "dao_member_project_idx" ON "dao_members" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "dao_member_wallet_idx" ON "dao_members" USING btree ("wallet");--> statement-breakpoint
CREATE INDEX "dao_member_campaign_idx" ON "dao_members" USING btree ("source_campaign_id");--> statement-breakpoint
CREATE INDEX "dao_treasury_snapshot_project_token_idx" ON "dao_treasury_snapshots" USING btree ("project_id","token");--> statement-breakpoint
CREATE INDEX "touch_lead_idx" ON "marketing_attribution_touches" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "touch_campaign_idx" ON "marketing_attribution_touches" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "identities_fingerprint_idx" ON "marketing_identities" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "identities_wallet_idx" ON "marketing_identities" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "identities_email_idx" ON "marketing_identities" USING btree ("email");--> statement-breakpoint
CREATE INDEX "identities_telegram_idx" ON "marketing_identities" USING btree ("telegram_id");--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_identity_id_marketing_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."marketing_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gamification_event_dedup_idx" ON "gamification_events" USING btree ("dedup_id");--> statement-breakpoint
CREATE INDEX "gamification_event_project_idx" ON "gamification_events" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "gamification_event_user_idx" ON "gamification_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_lead_idx" ON "marketing_lead_events" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "event_hash_idx" ON "marketing_lead_events" USING btree ("semantic_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_leads_project_identity_idx" ON "marketing_leads" USING btree ("project_id","identity_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "tx_link_status_idx" ON "transactions" USING btree ("link_id","status");