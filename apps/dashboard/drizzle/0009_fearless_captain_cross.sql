CREATE TYPE "public"."course_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."market_phase" AS ENUM('funding', 'ready', 'defense');--> statement-breakpoint
CREATE TYPE "public"."marketing_lead_intent" AS ENUM('invest', 'explore', 'whitelist', 'earn', 'other');--> statement-breakpoint
CREATE TYPE "public"."marketing_lead_status" AS ENUM('active', 'whitelisted', 'converted', 'bounced', 'unsubscribed');--> statement-breakpoint
ALTER TYPE "public"."event_type" ADD VALUE 'referral_joined' BEFORE 'profile_completed';--> statement-breakpoint
ALTER TYPE "public"."event_type" ADD VALUE 'referral_completed' BEFORE 'profile_completed';--> statement-breakpoint
ALTER TYPE "public"."event_type" ADD VALUE 'onboarding_tour_completed' BEFORE 'profile_completed';--> statement-breakpoint
ALTER TYPE "public"."event_type" ADD VALUE 'achievement_unlocked';--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"progress_pct" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" "course_difficulty" DEFAULT 'beginner' NOT NULL,
	"duration" text NOT NULL,
	"image_url" text,
	"xp_reward" integer DEFAULT 50 NOT NULL,
	"credits_reward" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"prerequisites" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skills_covered" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"instructor" text DEFAULT 'Pandora''s Team' NOT NULL,
	"enrolled_count" integer DEFAULT 0 NOT NULL,
	"completion_rate" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gamification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(255),
	"user_id" varchar(255),
	"telegram_user_id" varchar(255),
	"action_type" varchar(50) NOT NULL,
	"points_xp" integer DEFAULT 0 NOT NULL,
	"points_credits" integer DEFAULT 0 NOT NULL,
	"risk_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ipfs_hash" varchar(255),
	"admin_id" varchar(255),
	"core_action_id" varchar(255),
	"tx_hash" varchar(66),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gamification_logs_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "gamification_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" varchar(50) NOT NULL,
	"trigger" varchar(50) NOT NULL,
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"credits_reward" integer DEFAULT 0 NOT NULL,
	"is_repeatable" boolean DEFAULT false NOT NULL,
	"cooldown_hours" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"condition" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"copy_title" text,
	"copy_body" text,
	"points_xp" integer,
	"points_credits" integer,
	"ipfs_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gamification_rules_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
CREATE TABLE "governance_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" varchar(255) NOT NULL,
	"executor_address" varchar(42) NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"block_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governance_executions_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
CREATE TABLE "governance_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" varchar(255) NOT NULL,
	"protocol_id" integer NOT NULL,
	"governor_address" varchar(42) NOT NULL,
	"chain_id" integer NOT NULL,
	"proposer" varchar(42) NOT NULL,
	"description" text NOT NULL,
	"targets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"values" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"calldatas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_block" integer NOT NULL,
	"end_block" integer NOT NULL,
	"for_votes" numeric(78, 0) DEFAULT '0' NOT NULL,
	"against_votes" numeric(78, 0) DEFAULT '0' NOT NULL,
	"abstain_votes" numeric(78, 0) DEFAULT '0' NOT NULL,
	"quorum" numeric(78, 0) DEFAULT '0' NOT NULL,
	"participation_rate" numeric(10, 4) DEFAULT '0' NOT NULL,
	"quorum_reached" boolean DEFAULT false NOT NULL,
	"total_voting_supply_snapshot" numeric(78, 0) DEFAULT '0' NOT NULL,
	"quorum_snapshot" numeric(78, 0) DEFAULT '0' NOT NULL,
	"status" integer DEFAULT 0 NOT NULL,
	"is_executed" boolean DEFAULT false NOT NULL,
	"is_canceled" boolean DEFAULT false NOT NULL,
	"snapshot_block" integer,
	"deadline_block" integer,
	"is_invalid" boolean DEFAULT false NOT NULL,
	"created_tx_hash" varchar(66) NOT NULL,
	"created_block_number" integer NOT NULL,
	"block_hash" varchar(66),
	"block_number_indexed" integer,
	"indexer_version" varchar(50) DEFAULT '1.1.0',
	"governor_version" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governor_sync_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"governor_address" varchar(42) NOT NULL,
	"chain_id" integer NOT NULL,
	"last_processed_block" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governor_sync_state_governor_address_unique" UNIQUE("governor_address")
);
--> statement-breakpoint
CREATE TABLE "marketing_lead_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"project_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"phone_number" varchar(50),
	"wallet_address" varchar(42),
	"fingerprint" varchar(255),
	"identity_hash" varchar(255),
	"origin" varchar(512),
	"referrer" varchar(255),
	"status" "marketing_lead_status" DEFAULT 'active' NOT NULL,
	"intent" "marketing_lead_intent" DEFAULT 'explore' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_reward_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"lead_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"reward_type" varchar(50) NOT NULL,
	"amount" integer NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_points" (
	"telegram_user_id" varchar(255) PRIMARY KEY NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"harvest_credits" integer DEFAULT 0 NOT NULL,
	"locked_credits" integer DEFAULT 0 NOT NULL,
	"claimable_credits" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nft_ownership_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_address" varchar(42) NOT NULL,
	"chain_id" integer NOT NULL,
	"holder" varchar(42) NOT NULL,
	"balance" varchar(78) NOT NULL,
	"last_checked" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"tenant_id" varchar(100) NOT NULL,
	"roles" jsonb DEFAULT '[]'::jsonb,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"config" jsonb DEFAULT '{"nftContracts":[],"minTokenBalance":"0","requiredRoles":[],"whitelistedAddresses":[]}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_application_states" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "whatsapp_preapply_leads" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "whatsapp_application_states" CASCADE;--> statement-breakpoint
DROP TABLE "whatsapp_preapply_leads" CASCADE;--> statement-breakpoint
DROP INDEX "agora_listings_protocol_idx";--> statement-breakpoint
DROP INDEX "unique_vote";--> statement-breakpoint
DROP INDEX "protocol_navs_idx";--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "deployment_jobs" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "deployment_jobs" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "governance_votes" ALTER COLUMN "proposal_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "governance_votes" ALTER COLUMN "voter_address" SET DATA TYPE varchar(42);--> statement-breakpoint
ALTER TABLE "governance_votes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "governance_votes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "governance_votes" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "administrators" ADD COLUMN "allowed_domains" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "administrators" ADD COLUMN "secret_key" varchar(255);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "event" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "category" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "address" varchar(42);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "tenant_id" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "ip" varchar(45) NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "userAgent" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "success" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "error_code" varchar(50);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "whatsapp" varchar(50);--> statement-breakpoint
ALTER TABLE "governance_votes" ADD COLUMN "weight" numeric(78, 0) NOT NULL;--> statement-breakpoint
ALTER TABLE "governance_votes" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "governance_votes" ADD COLUMN "tx_hash" varchar(66) NOT NULL;--> statement-breakpoint
ALTER TABLE "governance_votes" ADD COLUMN "log_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "governance_votes" ADD COLUMN "block_number" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "governance_votes" ADD COLUMN "block_hash" varchar(66);--> statement-breakpoint
ALTER TABLE "governance_votes" ADD COLUMN "chain_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "governance_votes" ADD COLUMN "governor_address" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "integration_clients" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "protocl_mecanism" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "artefact_utility" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "worktoearn_mecanism" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "monetization_model" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "adquire_strategy" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "mitigation_plan" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "protocol_configs" ADD COLUMN "market_phase" "market_phase" DEFAULT 'funding' NOT NULL;--> statement-breakpoint
ALTER TABLE "protocol_configs" ADD COLUMN "ready_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_frozen" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "acquisition_source" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referrer_core_user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_harvest_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_proposals" ADD CONSTRAINT "governance_proposals_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_lead_events" ADD CONSTRAINT "marketing_lead_events_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_reward_logs" ADD CONSTRAINT "marketing_reward_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_reward_logs" ADD CONSTRAINT "marketing_reward_logs_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_reward_logs" ADD CONSTRAINT "marketing_reward_logs_event_id_marketing_lead_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."marketing_lead_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_course_enrollment" ON "course_enrollments" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_governance_execution" ON "governance_executions" USING btree ("proposal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_governance_proposal" ON "governance_proposals" USING btree ("proposal_id","governor_address","chain_id");--> statement-breakpoint
CREATE INDEX "gov_proposals_protocol_idx" ON "governance_proposals" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "gov_proposals_status_idx" ON "governance_proposals" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_leads_project_email_idx" ON "marketing_leads" USING btree ("project_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_reward_unique_idx" ON "marketing_reward_logs" USING btree ("user_id","event_id","reward_type");--> statement-breakpoint
CREATE UNIQUE INDEX "nft_cache_contract_holder_idx" ON "nft_ownership_cache" USING btree ("contract_address","chain_id","holder");--> statement-breakpoint
CREATE INDEX "nft_cache_expires_idx" ON "nft_ownership_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_users_user_tenant_idx" ON "tenant_users" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_users_tenant_idx" ON "tenant_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenants_name_idx" ON "tenants" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tenants_active_idx" ON "tenants" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "integration_clients" ADD CONSTRAINT "integration_clients_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_address_idx" ON "audit_logs" USING btree ("address");--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_logs_event_idx" ON "audit_logs" USING btree ("event");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_metrics_email_id_idx" ON "email_metrics" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "email_metrics_type_status_idx" ON "email_metrics" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "email_metrics_status_idx" ON "email_metrics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_metrics_recipient_idx" ON "email_metrics" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "email_metrics_created_at_idx" ON "email_metrics" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_governance_vote_log" ON "governance_votes" USING btree ("tx_hash","log_index","chain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_governance_voter_proposal" ON "governance_votes" USING btree ("voter_address","proposal_id","governor_address","chain_id");--> statement-breakpoint
CREATE INDEX "gov_votes_block_idx" ON "governance_votes" USING btree ("block_number");--> statement-breakpoint
CREATE INDEX "project_slug_index" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "project_is_deleted_index" ON "projects" USING btree ("is_deleted");--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN "actor_type";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN "actor_id";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN "action";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN "resource";--> statement-breakpoint
ALTER TABLE "governance_votes" DROP COLUMN "signature";