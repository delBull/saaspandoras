CREATE TYPE "public"."achievement_type" AS ENUM('first_steps', 'investor', 'community_builder', 'tokenization_expert', 'early_adopter', 'high_roller', 'creator', 'dao_pioneer', 'artifact_collector', 'defi_starter', 'governor', 'yield_hunter', 'explorer', 'projects', 'investments', 'community', 'learning', 'streaks', 'special');--> statement-breakpoint
CREATE TYPE "public"."audit_actor_type" AS ENUM('integration', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'rescheduled', 'no_show', 'completed');--> statement-breakpoint
CREATE TYPE "public"."business_category" AS ENUM('residential_real_estate', 'commercial_real_estate', 'tech_startup', 'renewable_energy', 'art_collectibles', 'intellectual_property', 'defi', 'gaming', 'metaverse', 'music_audio', 'sports_fan_tokens', 'education', 'healthcare', 'supply_chain', 'infrastructure', 'social_networks', 'carbon_credits', 'insurance', 'prediction_markets', 'other');--> statement-breakpoint
CREATE TYPE "public"."campaign_scope" AS ENUM('b2b', 'b2c');--> statement-breakpoint
CREATE TYPE "public"."campaign_source" AS ENUM('whatsapp', 'demand_engine', 'manual');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('protocol_acquisition', 'user_acquisition');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('lead', 'negotiating', 'closed_won', 'closed_lost', 'churned', 'archived', 'nurturing');--> statement-breakpoint
CREATE TYPE "public"."config_queue_status" AS ENUM('PENDING', 'EXECUTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."course_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."dao_activity_status" AS ENUM('active', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."dao_activity_submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."dao_activity_type" AS ENUM('social', 'on_chain', 'content', 'custom');--> statement-breakpoint
CREATE TYPE "public"."deployment_job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('projects', 'investments', 'community', 'learning', 'daily', 'special');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('project_application_submitted', 'project_application_approved', 'protocol_deployed', 'sale_certified', 'investment_made', 'user_registered', 'daily_login', 'referral_made', 'referral_joined', 'referral_completed', 'onboarding_tour_completed', 'profile_completed', 'community_post', 'course_started', 'course_completed', 'quiz_passed', 'streak_milestone', 'beta_access', 'feature_unlock', 'milestone_reached', 'dao_activated', 'artifact_purchased', 'staking_deposit', 'proposal_vote', 'rewards_claimed', 'activity_completed', 'forum_post', 'access_card_acquired', 'artifact_acquired', 'achievement_unlocked');--> statement-breakpoint
CREATE TYPE "public"."execution_status" AS ENUM('active', 'paused', 'completed', 'intercepted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."governance_event_status" AS ENUM('scheduled', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."governance_event_type" AS ENUM('on_chain_proposal', 'off_chain_signal', 'meeting', 'update');--> statement-breakpoint
CREATE TYPE "public"."integration_environment" AS ENUM('staging', 'production');--> statement-breakpoint
CREATE TYPE "public"."integration_permission" AS ENUM('deploy', 'read', 'governance', 'treasury');--> statement-breakpoint
CREATE TYPE "public"."inventory_status" AS ENUM('HELD', 'LISTED', 'SOLD');--> statement-breakpoint
CREATE TYPE "public"."lead_attribution_method" AS ENUM('domain_match', 'fingerprint_match', 'email_match', 'manual');--> statement-breakpoint
CREATE TYPE "public"."lead_attribution_type" AS ENUM('exclusive', 'shared');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('ACTIVE', 'LOCKED', 'SOLD', 'CANCELLED', 'ROFR_PENDING');--> statement-breakpoint
CREATE TYPE "public"."market_phase" AS ENUM('funding', 'ready', 'defense');--> statement-breakpoint
CREATE TYPE "public"."marketing_lead_intent" AS ENUM('invest', 'explore', 'whitelist', 'earn', 'other');--> statement-breakpoint
CREATE TYPE "public"."marketing_lead_quality" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."marketing_lead_scope" AS ENUM('b2b', 'b2c');--> statement-breakpoint
CREATE TYPE "public"."marketing_lead_status" AS ENUM('active', 'whitelisted', 'converted', 'new', 'NEW', 'bounced', 'unsubscribed', 'scheduled', 'no_show', 'cancelled', 'archived', 'nurturing');--> statement-breakpoint
CREATE TYPE "public"."owner_context" AS ENUM('pandora', 'client');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('stripe', 'crypto', 'wire');--> statement-breakpoint
CREATE TYPE "public"."points_category" AS ENUM('project_application', 'investment', 'daily_login', 'community', 'special_event');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'pending', 'active_client', 'approved', 'live', 'completed', 'incomplete', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."referral_source" AS ENUM('direct', 'link', 'code', 'social');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'completed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('ACTIVE', 'RELEASED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('token_discount', 'badge', 'priority_access', 'bonus_points', 'nft');--> statement-breakpoint
CREATE TYPE "public"."shortlink_type" AS ENUM('redirect', 'landing');--> statement-breakpoint
CREATE TYPE "public"."token_type" AS ENUM('erc20', 'erc721', 'erc1155');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."trigger_type" AS ENUM('manual', 'auto_registration', 'api_event');--> statement-breakpoint
CREATE TYPE "public"."webhook_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."yield_source" AS ENUM('rental_income', 'capital_appreciation', 'dividends', 'royalties', 'other');--> statement-breakpoint
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
CREATE TABLE "account_recovery_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"scope" varchar(20) DEFAULT 'recovery' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50),
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(10) NOT NULL,
	"type" "achievement_type" NOT NULL,
	"required_points" integer DEFAULT 0 NOT NULL,
	"required_level" integer DEFAULT 1 NOT NULL,
	"required_events" jsonb,
	"points_reward" integer DEFAULT 0 NOT NULL,
	"badge_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "action_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"correlation_id" varchar(255) NOT NULL,
	"action_type" varchar(255) NOT NULL,
	"protocol_id" integer,
	"artifact_id" varchar(255),
	"user_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "administrators" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"alias" varchar(100),
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"added_by" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"availability" jsonb,
	"allowed_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"secret_key" varchar(255),
	CONSTRAINT "administrators_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "agora_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" integer NOT NULL,
	"artifact_id" varchar(255) NOT NULL,
	"seller_telegram_id" varchar(255) NOT NULL,
	"price" numeric(24, 8) NOT NULL,
	"status" "listing_status" DEFAULT 'ACTIVE' NOT NULL,
	"locked_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"idempotency_key" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agora_listings_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"owner_id" varchar(255) NOT NULL,
	"last_listing_cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"address" varchar(42),
	"tenant_id" varchar(100),
	"ip" varchar(45) NOT NULL,
	"userAgent" text,
	"success" boolean NOT NULL,
	"error_code" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" varchar(42) NOT NULL,
	"nonce" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_challenges_nonce_unique" UNIQUE("nonce")
);
--> statement-breakpoint
CREATE TABLE "buyback_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" integer NOT NULL,
	"artifact_id" varchar(255) NOT NULL,
	"reserved_amount" numeric(24, 8) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "reservation_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyback_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid NOT NULL,
	"listing_id" uuid,
	"artifact_id" varchar(255) NOT NULL,
	"amount_paid" numeric(24, 8) NOT NULL,
	"acquisition_type" varchar(50) NOT NULL,
	"correlation_id" varchar(255),
	"processed_by" varchar(255),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_stats" (
	"campaign_id" integer PRIMARY KEY NOT NULL,
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
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"draft_id" integer,
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
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"whatsapp" varchar(50),
	"name" varchar(255),
	"wallet_address" varchar(42),
	"source" varchar(50) DEFAULT 'manual',
	"package" varchar(50),
	"status" "client_status" DEFAULT 'lead' NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "dao_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"reward_amount" numeric(18, 6) DEFAULT '0' NOT NULL,
	"reward_token_symbol" varchar(20) DEFAULT 'PBOX' NOT NULL,
	"category" varchar(50) DEFAULT 'social',
	"requirements" jsonb DEFAULT '{}'::jsonb,
	"type" "dao_activity_type" DEFAULT 'custom' NOT NULL,
	"status" "dao_activity_status" DEFAULT 'active' NOT NULL,
	"external_link" text,
	"started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dao_activity_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"activity_id" integer NOT NULL,
	"user_wallet" varchar(42) NOT NULL,
	"proof_data" text,
	"status" "dao_activity_submission_status" DEFAULT 'pending' NOT NULL,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"started_at" timestamp with time zone,
	"status_updated_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dao_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"wallet" varchar(42) NOT NULL,
	"voting_power" numeric(18, 6) DEFAULT '0.000000' NOT NULL,
	"artifacts_count" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dao_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"author_address" varchar(42) NOT NULL,
	"content" text NOT NULL,
	"is_solution" boolean DEFAULT false,
	"likes_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dao_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"author_address" varchar(42) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(50) DEFAULT 'general',
	"is_official" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
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
	"id" serial PRIMARY KEY NOT NULL,
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
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"value" numeric(18, 2),
	"source" varchar(50) DEFAULT 'shortlink' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_slug" varchar(256) NOT NULL,
	"status" "deployment_job_status" DEFAULT 'pending' NOT NULL,
	"step" varchar(100) DEFAULT 'queued',
	"network" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_id" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'unknown' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"email_subject" text,
	"clicked_url" text,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"bounced_at" timestamp with time zone,
	"complaint_at" timestamp with time zone,
	"user_agent" text,
	"ip_address" varchar(45),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_metrics_email_id_unique" UNIQUE("email_id")
);
--> statement-breakpoint
CREATE TABLE "gamification_action_executions" (
	"event_id" text NOT NULL,
	"trigger_id" text NOT NULL,
	"action_type" text NOT NULL,
	"user_id" text NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gamification_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "event_type" NOT NULL,
	"category" "event_category" NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"project_id" integer,
	"metadata" jsonb,
	"dedup_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
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
CREATE TABLE "gamification_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"claimed_points" integer DEFAULT 0 NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"level_progress" integer DEFAULT 0 NOT NULL,
	"points_to_next_level" integer DEFAULT 100 NOT NULL,
	"projects_applied" integer DEFAULT 0 NOT NULL,
	"projects_approved" integer DEFAULT 0 NOT NULL,
	"total_invested" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"community_contributions" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_active_days" integer DEFAULT 0 NOT NULL,
	"referrals_count" integer DEFAULT 0 NOT NULL,
	"community_rank" integer DEFAULT 0 NOT NULL,
	"reputation_score" integer DEFAULT 0 NOT NULL,
	"last_activity_date" timestamp DEFAULT now() NOT NULL,
	"last_claimed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gamification_profiles_user_id_unique" UNIQUE("user_id")
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
CREATE TABLE "governance_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"type" "governance_event_type" DEFAULT 'on_chain_proposal' NOT NULL,
	"status" "governance_event_status" DEFAULT 'scheduled' NOT NULL,
	"external_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "governance_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" varchar(255) NOT NULL,
	"voter_address" varchar(42) NOT NULL,
	"support" integer NOT NULL,
	"weight" numeric(78, 0) NOT NULL,
	"reason" text,
	"tx_hash" varchar(66) NOT NULL,
	"log_index" integer DEFAULT 0 NOT NULL,
	"block_number" integer NOT NULL,
	"block_hash" varchar(66),
	"chain_id" integer NOT NULL,
	"governor_address" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "integration_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"environment" "integration_environment" DEFAULT 'staging' NOT NULL,
	"project_id" integer,
	"api_key_hash" text NOT NULL,
	"key_fingerprint" varchar(255) NOT NULL,
	"callback_url" text,
	"callback_secret_hash" text,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_attribution_touches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"campaign_id" integer,
	"touch_type" varchar(100) NOT NULL,
	"weight" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"trigger_type" "trigger_type" DEFAULT 'manual' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_executions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"lead_id" varchar(36),
	"campaign_id" integer NOT NULL,
	"status" "execution_status" DEFAULT 'active' NOT NULL,
	"current_stage_index" integer DEFAULT 0 NOT NULL,
	"next_run_at" timestamp,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "marketing_lead_attributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"attribution_type" "lead_attribution_type" DEFAULT 'shared' NOT NULL,
	"attribution_method" "lead_attribution_method" NOT NULL,
	"confidence_score" numeric(3, 2) NOT NULL,
	"attributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_lead_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"semantic_hash" varchar(64),
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"project_id" integer NOT NULL,
	"owner_context" "owner_context" DEFAULT 'client' NOT NULL,
	"scope" "marketing_lead_scope" DEFAULT 'b2c' NOT NULL,
	"identity_id" uuid,
	"lead_type" varchar(100) DEFAULT 'user_prospect',
	"email" varchar(255),
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
	"quality" "marketing_lead_quality" DEFAULT 'low' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"conversion_value" numeric(12, 2),
	"probability" integer,
	"expected_close_date" timestamp with time zone,
	"last_action" varchar(100),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"source" varchar(100) DEFAULT 'unknown',
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"language" varchar(10) DEFAULT 'es',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pandora_buyback_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" integer NOT NULL,
	"allocated_capital" numeric(24, 8) NOT NULL,
	"available_capital" numeric(24, 8) NOT NULL,
	"target_reserve_ratio" numeric(5, 4) NOT NULL,
	"last_rebalance_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pandora_buyback_pools_protocol_id_unique" UNIQUE("protocol_id")
);
--> statement-breakpoint
CREATE TABLE "pandora_inventories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_id" varchar(255) NOT NULL,
	"protocol_id" integer NOT NULL,
	"acquisition_type" varchar(50) NOT NULL,
	"acquisition_nav" numeric(24, 8) NOT NULL,
	"acquisition_price" numeric(24, 8) NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"relist_eligible_at" timestamp with time zone,
	"status" "inventory_status" DEFAULT 'HELD' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pandora_inventories_artifact_id_unique" UNIQUE("artifact_id")
);
--> statement-breakpoint
CREATE TABLE "payment_links" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"amount" numeric(18, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"methods" jsonb DEFAULT '["stripe","crypto","wire"]'::jsonb NOT NULL,
	"destination_wallet" varchar(42),
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pbox_balances" (
	"wallet_address" text PRIMARY KEY NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"claimed" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pbox_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"tx_hash" varchar(66),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(42),
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"slug" varchar(256) NOT NULL,
	"logo_url" text,
	"cover_photo_url" text,
	"tagline" varchar(140),
	"description" text NOT NULL,
	"business_category" "business_category" DEFAULT 'other',
	"video_pitch" varchar(512),
	"website" varchar(512),
	"whitepaper_url" varchar(512),
	"twitter_url" varchar(512),
	"discord_url" varchar(512),
	"discord_webhook_url" text,
	"telegram_url" varchar(512),
	"linkedin_url" varchar(512),
	"target_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"total_valuation_usd" numeric(18, 2),
	"token_type" "token_type" DEFAULT 'erc20',
	"total_tokens" integer,
	"tokens_offered" integer,
	"token_price_usd" numeric(18, 6),
	"estimated_apy" varchar(50),
	"yield_source" "yield_source" DEFAULT 'other',
	"lockup_period" varchar(100),
	"fund_usage" text,
	"recurring_rewards" text,
	"staking_rewards_enabled" boolean DEFAULT false,
	"staking_rewards_details" text,
	"revenue_sharing_enabled" boolean DEFAULT false,
	"revenue_sharing_details" text,
	"work_to_earn_enabled" boolean DEFAULT false,
	"work_to_earn_details" text,
	"tiered_access_enabled" boolean DEFAULT false,
	"tiered_access_details" text,
	"discounted_fees_enabled" boolean DEFAULT false,
	"discounted_fees_details" text,
	"team_members" jsonb,
	"advisors" jsonb,
	"token_distribution" jsonb,
	"contract_address" varchar(42),
	"treasury_address" varchar(42),
	"license_contract_address" varchar(42),
	"utility_contract_address" varchar(42),
	"loom_contract_address" varchar(42),
	"governor_contract_address" varchar(42),
	"registry_contract_address" varchar(42),
	"artifacts" jsonb DEFAULT '[]'::jsonb,
	"protocol_version" integer DEFAULT 1,
	"chain_id" integer,
	"deployment_status" varchar(50) DEFAULT 'pending',
	"w2e_config" jsonb DEFAULT '{}'::jsonb,
	"page_layout_type" varchar(50),
	"legal_status" text,
	"valuation_document_url" text,
	"fiduciary_entity" varchar(256),
	"due_diligence_report_url" text,
	"is_mintable" boolean DEFAULT false,
	"is_mutable" boolean DEFAULT false,
	"update_authority_address" varchar(42),
	"applicant_name" varchar(256),
	"applicant_position" varchar(256),
	"applicant_email" varchar(256),
	"applicant_phone" varchar(50),
	"applicant_wallet_address" varchar(42),
	"verification_agreement" boolean DEFAULT false,
	"integration_details" text,
	"legal_entity_help" boolean DEFAULT false,
	"protocl_mecanism" text,
	"artefact_utility" text,
	"worktoearn_mecanism" text,
	"monetization_model" text,
	"adquire_strategy" text,
	"mitigation_plan" text,
	"image_url" text,
	"socials" jsonb,
	"raised_amount" numeric(18, 2) DEFAULT '0.00',
	"returns_paid" numeric(18, 2) DEFAULT '0.00',
	"voting_contract_address" varchar(42),
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"featured_button_text" varchar(100) DEFAULT 'Dime más',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"access_type" varchar(20) DEFAULT 'free',
	"price" numeric(18, 6) DEFAULT '0.000000',
	"allowed_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "protocol_config_queues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" integer NOT NULL,
	"proposed_fee_rate" numeric(5, 4),
	"proposed_inventory_max_ratio" numeric(5, 4),
	"proposed_early_exit_penalty" numeric(5, 4),
	"proposed_buyback_allocation_ratio" numeric(5, 4),
	"proposed_settlement_paused" boolean,
	"effective_at" timestamp with time zone NOT NULL,
	"status" "config_queue_status" DEFAULT 'PENDING' NOT NULL,
	"proposed_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_configs" (
	"protocol_id" integer PRIMARY KEY NOT NULL,
	"fee_rate" numeric(5, 4) DEFAULT '0.0200' NOT NULL,
	"inventory_max_ratio" numeric(5, 4) DEFAULT '0.2500' NOT NULL,
	"early_exit_penalty" numeric(5, 4) DEFAULT '0.1500' NOT NULL,
	"buyback_allocation_ratio" numeric(5, 4) DEFAULT '1.0000' NOT NULL,
	"settlement_paused" boolean DEFAULT false NOT NULL,
	"market_phase" "market_phase" DEFAULT 'funding' NOT NULL,
	"ready_since" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "protocol_navs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" integer NOT NULL,
	"nav" numeric(24, 8) NOT NULL,
	"treasury" numeric(24, 8) NOT NULL,
	"supply" integer NOT NULL,
	"min_price" numeric(24, 8) NOT NULL,
	"max_price" numeric(24, 8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"project_id" integer NOT NULL,
	"amount" numeric(18, 6) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"purchase_id" varchar(255) NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"thirdweb_session_id" varchar(255),
	"stripe_session_id" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_purchase_id_unique" UNIQUE("purchase_id"),
	CONSTRAINT "purchases_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(10) NOT NULL,
	"type" "reward_type" NOT NULL,
	"required_points" integer DEFAULT 0 NOT NULL,
	"required_level" integer DEFAULT 1 NOT NULL,
	"value" varchar(100) NOT NULL,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"stock" integer,
	"claimed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduling_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"slot_id" text NOT NULL,
	"lead_name" text NOT NULL,
	"lead_email" text NOT NULL,
	"lead_phone" text,
	"notification_preference" varchar(20) DEFAULT 'email' NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"meeting_link" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text
);
--> statement-breakpoint
CREATE TABLE "scheduling_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"is_booked" boolean DEFAULT false NOT NULL,
	"reserved_until" timestamp with time zone,
	"reserved_by" varchar(255),
	"type" varchar(50) DEFAULT '30_min' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"type" varchar(50) NOT NULL,
	"metadata" jsonb,
	"ip" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"scope" varchar(20) NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"revoked_reason" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "shortlink_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(50) NOT NULL,
	"domain" varchar(100),
	"ip" varchar(45),
	"user_agent" text,
	"referer" text,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"utm_term" varchar(100),
	"utm_content" varchar(100),
	"device_type" varchar(50),
	"browser" varchar(100),
	"country" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shortlinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"destination_url" text NOT NULL,
	"title" varchar(255),
	"description" text,
	"type" "shortlink_type" DEFAULT 'redirect' NOT NULL,
	"landing_config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shortlinks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sow_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"tier" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"variables" jsonb DEFAULT '[]',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_user_id" text NOT NULL,
	"wallet_address" text NOT NULL,
	"source" text DEFAULT 'telegram' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_bindings_telegram_user_id_unique" UNIQUE("telegram_user_id")
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
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"link_id" text,
	"client_id" text,
	"amount" numeric(18, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"achievement_id" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"unlocked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_balances" (
	"wallet_address" varchar(42) PRIMARY KEY NOT NULL,
	"pbox_balance" numeric(18, 2) DEFAULT '0' NOT NULL,
	"usdc_balance" numeric(18, 6) DEFAULT '0' NOT NULL,
	"eth_balance" numeric(18, 18) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"category" "points_category" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_wallet_address" varchar(42) NOT NULL,
	"referred_wallet_address" varchar(42) NOT NULL,
	"referral_source" "referral_source" DEFAULT 'direct',
	"status" "referral_status" DEFAULT 'pending',
	"referrer_points_awarded" boolean DEFAULT false,
	"referred_points_awarded" boolean DEFAULT false,
	"referred_completed_onboarding" boolean DEFAULT false,
	"referred_first_project" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"referrer_bonus_date" timestamp,
	"referred_bonus_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"reward_id" integer NOT NULL,
	"is_claimed" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp,
	"claim_transaction_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"image" text,
	"walletAddress" varchar(42),
	"telegram_id" varchar(255),
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"hasPandorasKey" boolean DEFAULT false NOT NULL,
	"kycLevel" varchar(20) DEFAULT 'basic' NOT NULL,
	"kycCompleted" boolean DEFAULT false NOT NULL,
	"kycData" jsonb,
	"username" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"is_frozen" boolean DEFAULT false NOT NULL,
	"acquisition_source" varchar(255),
	"referrer_core_user_id" varchar(255),
	"last_harvest_at" timestamp,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"connectionCount" integer DEFAULT 1 NOT NULL,
	"lastConnectionAt" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"access_cohort" varchar(50) DEFAULT 'public',
	"benefits_tier" varchar(50) DEFAULT 'standard',
	"access_granted_at" timestamp,
	"wallet_verified" boolean DEFAULT false NOT NULL,
	"ritual_completed_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_walletAddress_unique" UNIQUE("walletAddress"),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"event" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "webhook_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"direction" text NOT NULL,
	"body" text,
	"message_type" text DEFAULT 'text' NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"flow_type" text NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_users" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"name" text,
	"priority_level" text DEFAULT 'normal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_users_phone_unique" UNIQUE("phone")
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
ALTER TABLE "account_recovery_tokens" ADD CONSTRAINT "account_recovery_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agora_listings" ADD CONSTRAINT "agora_listings_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyback_reservations" ADD CONSTRAINT "buyback_reservations_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyback_transactions" ADD CONSTRAINT "buyback_transactions_pool_id_pandora_buyback_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pandora_buyback_pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyback_transactions" ADD CONSTRAINT "buyback_transactions_listing_id_agora_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."agora_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_stats" ADD CONSTRAINT "campaign_stats_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_draft_id_demand_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."demand_drafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_activities" ADD CONSTRAINT "dao_activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_activity_submissions" ADD CONSTRAINT "dao_activity_submissions_activity_id_dao_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."dao_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_members" ADD CONSTRAINT "dao_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_posts" ADD CONSTRAINT "dao_posts_thread_id_dao_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."dao_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_treasury" ADD CONSTRAINT "dao_treasury_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_treasury_snapshots" ADD CONSTRAINT "dao_treasury_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_drafts" ADD CONSTRAINT "demand_drafts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_events" ADD CONSTRAINT "demand_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_jobs" ADD CONSTRAINT "deployment_jobs_project_slug_projects_slug_fk" FOREIGN KEY ("project_slug") REFERENCES "public"."projects"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_profiles" ADD CONSTRAINT "gamification_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_events" ADD CONSTRAINT "governance_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_proposals" ADD CONSTRAINT "governance_proposals_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_actions_log" ADD CONSTRAINT "growth_actions_log_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_clients" ADD CONSTRAINT "integration_clients_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_attribution_touches" ADD CONSTRAINT "marketing_attribution_touches_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_attribution_touches" ADD CONSTRAINT "marketing_attribution_touches_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_executions" ADD CONSTRAINT "marketing_executions_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_identities" ADD CONSTRAINT "marketing_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_lead_attributions" ADD CONSTRAINT "marketing_lead_attributions_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_lead_attributions" ADD CONSTRAINT "marketing_lead_attributions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_lead_events" ADD CONSTRAINT "marketing_lead_events_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_identity_id_marketing_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."marketing_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_reward_logs" ADD CONSTRAINT "marketing_reward_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_reward_logs" ADD CONSTRAINT "marketing_reward_logs_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_reward_logs" ADD CONSTRAINT "marketing_reward_logs_event_id_marketing_lead_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."marketing_lead_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pandora_buyback_pools" ADD CONSTRAINT "pandora_buyback_pools_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pandora_inventories" ADD CONSTRAINT "pandora_inventories_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pbox_claims" ADD CONSTRAINT "pbox_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_config_queues" ADD CONSTRAINT "protocol_config_queues_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_configs" ADD CONSTRAINT "protocol_configs_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_navs" ADD CONSTRAINT "protocol_navs_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduling_bookings" ADD CONSTRAINT "scheduling_bookings_slot_id_scheduling_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."scheduling_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduling_slots" ADD CONSTRAINT "scheduling_slots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortlinks" ADD CONSTRAINT "shortlinks_created_by_users_walletAddress_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("walletAddress") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_link_id_payment_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."payment_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_client_id_integration_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."integration_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_session_id_whatsapp_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_user_id_whatsapp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."whatsapp_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_address_idx" ON "audit_logs" USING btree ("address");--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_logs_event_idx" ON "audit_logs" USING btree ("event");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_challenges_address_idx" ON "auth_challenges" USING btree ("address");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_course_enrollment" ON "course_enrollments" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_member" ON "dao_members" USING btree ("project_id","wallet");--> statement-breakpoint
CREATE INDEX "dao_member_project_idx" ON "dao_members" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "dao_member_wallet_idx" ON "dao_members" USING btree ("wallet");--> statement-breakpoint
CREATE INDEX "dao_treasury_snapshot_project_token_idx" ON "dao_treasury_snapshots" USING btree ("project_id","token");--> statement-breakpoint
CREATE UNIQUE INDEX "email_metrics_email_id_idx" ON "email_metrics" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "email_metrics_type_status_idx" ON "email_metrics" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "email_metrics_status_idx" ON "email_metrics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_metrics_recipient_idx" ON "email_metrics" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "email_metrics_created_at_idx" ON "email_metrics" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "gamification_event_dedup_idx" ON "gamification_events" USING btree ("dedup_id");--> statement-breakpoint
CREATE INDEX "gamification_event_project_idx" ON "gamification_events" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "gamification_event_user_idx" ON "gamification_events" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_governance_execution" ON "governance_executions" USING btree ("proposal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_governance_proposal" ON "governance_proposals" USING btree ("proposal_id","governor_address","chain_id");--> statement-breakpoint
CREATE INDEX "gov_proposals_protocol_idx" ON "governance_proposals" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "gov_proposals_status_idx" ON "governance_proposals" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_governance_vote_log" ON "governance_votes" USING btree ("tx_hash","log_index","chain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_governance_voter_proposal" ON "governance_votes" USING btree ("voter_address","proposal_id","governor_address","chain_id");--> statement-breakpoint
CREATE INDEX "gov_votes_block_idx" ON "governance_votes" USING btree ("block_number");--> statement-breakpoint
CREATE INDEX "touch_lead_idx" ON "marketing_attribution_touches" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "touch_campaign_idx" ON "marketing_attribution_touches" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "identities_fingerprint_idx" ON "marketing_identities" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "identities_wallet_idx" ON "marketing_identities" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "identities_email_idx" ON "marketing_identities" USING btree ("email");--> statement-breakpoint
CREATE INDEX "identities_telegram_idx" ON "marketing_identities" USING btree ("telegram_id");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_lead_project_unique_idx" ON "marketing_lead_attributions" USING btree ("lead_id","project_id");--> statement-breakpoint
CREATE INDEX "attribution_lead_idx" ON "marketing_lead_attributions" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "attribution_project_idx" ON "marketing_lead_attributions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "event_lead_idx" ON "marketing_lead_events" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "event_hash_idx" ON "marketing_lead_events" USING btree ("semantic_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_leads_project_identity_idx" ON "marketing_leads" USING btree ("project_id","identity_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_reward_unique_idx" ON "marketing_reward_logs" USING btree ("user_id","event_id","reward_type");--> statement-breakpoint
CREATE INDEX "project_slug_index" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "project_is_deleted_index" ON "projects" USING btree ("is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "tx_link_status_idx" ON "transactions" USING btree ("link_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_achievement" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_referral" ON "user_referrals" USING btree ("referrer_wallet_address","referred_wallet_address");--> statement-breakpoint
CREATE UNIQUE INDEX "nft_cache_contract_holder_idx" ON "nft_ownership_cache" USING btree ("contract_address","chain_id","holder");--> statement-breakpoint
CREATE INDEX "nft_cache_expires_idx" ON "nft_ownership_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_users_user_tenant_idx" ON "tenant_users" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_users_tenant_idx" ON "tenant_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenants_name_idx" ON "tenants" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tenants_active_idx" ON "tenants" USING btree ("is_active");