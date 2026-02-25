CREATE TYPE "public"."achievement_type" AS ENUM('first_steps', 'investor', 'community_builder', 'tokenization_expert', 'early_adopter', 'high_roller', 'creator', 'dao_pioneer', 'artifact_collector', 'defi_starter', 'governor', 'yield_hunter', 'explorer');--> statement-breakpoint
CREATE TYPE "public"."audit_actor_type" AS ENUM('integration', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."business_category" AS ENUM('residential_real_estate', 'commercial_real_estate', 'tech_startup', 'renewable_energy', 'art_collectibles', 'intellectual_property', 'defi', 'gaming', 'metaverse', 'music_audio', 'sports_fan_tokens', 'education', 'healthcare', 'supply_chain', 'infrastructure', 'social_networks', 'carbon_credits', 'insurance', 'prediction_markets', 'other');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('lead', 'negotiating', 'closed_won', 'closed_lost', 'churned');--> statement-breakpoint
CREATE TYPE "public"."dao_activity_status" AS ENUM('active', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."dao_activity_submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."dao_activity_type" AS ENUM('social', 'on_chain', 'content', 'custom');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('projects', 'investments', 'community', 'learning', 'daily', 'special');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('project_application_submitted', 'project_application_approved', 'protocol_deployed', 'sale_certified', 'investment_made', 'user_registered', 'daily_login', 'referral_made', 'profile_completed', 'community_post', 'course_started', 'course_completed', 'quiz_passed', 'streak_milestone', 'beta_access', 'feature_unlock', 'milestone_reached', 'dao_activated', 'artifact_purchased', 'staking_deposit', 'proposal_vote', 'rewards_claimed', 'activity_completed', 'forum_post', 'access_card_acquired', 'artifact_acquired');--> statement-breakpoint
CREATE TYPE "public"."execution_status" AS ENUM('active', 'paused', 'completed', 'intercepted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."governance_event_status" AS ENUM('scheduled', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."governance_event_type" AS ENUM('on_chain_proposal', 'off_chain_signal', 'meeting', 'update');--> statement-breakpoint
CREATE TYPE "public"."integration_environment" AS ENUM('staging', 'production');--> statement-breakpoint
CREATE TYPE "public"."integration_permission" AS ENUM('deploy', 'read', 'governance', 'treasury');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('stripe', 'crypto', 'wire');--> statement-breakpoint
CREATE TYPE "public"."points_category" AS ENUM('project_application', 'investment', 'daily_login', 'community', 'special_event');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'pending', 'active_client', 'approved', 'live', 'completed', 'incomplete', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."referral_source" AS ENUM('direct', 'link', 'code', 'social');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'completed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('token_discount', 'badge', 'priority_access', 'bonus_points', 'nft');--> statement-breakpoint
CREATE TYPE "public"."shortlink_type" AS ENUM('redirect', 'landing');--> statement-breakpoint
CREATE TYPE "public"."token_type" AS ENUM('erc20', 'erc721', 'erc1155');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."trigger_type" AS ENUM('manual', 'auto_registration', 'api_event');--> statement-breakpoint
CREATE TYPE "public"."webhook_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."yield_source" AS ENUM('rental_income', 'capital_appreciation', 'dividends', 'royalties', 'other');--> statement-breakpoint
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
CREATE TABLE "administrators" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"alias" varchar(100),
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"added_by" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"availability" jsonb,
	CONSTRAINT "administrators_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_type" "audit_actor_type" NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"action" varchar(255) NOT NULL,
	"resource" varchar(255) NOT NULL,
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
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
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
CREATE TABLE "email_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_id" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'unknown' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"recipient" varchar(255),
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
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
CREATE TABLE "governance_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL,
	"voter_address" text NOT NULL,
	"support" integer NOT NULL,
	"signature" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"environment" "integration_environment" DEFAULT 'staging' NOT NULL,
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
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
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
	"hasPandorasKey" boolean DEFAULT false NOT NULL,
	"kycLevel" varchar(20) DEFAULT 'basic' NOT NULL,
	"kycCompleted" boolean DEFAULT false NOT NULL,
	"kycData" jsonb,
	"connectionCount" integer DEFAULT 1 NOT NULL,
	"lastConnectionAt" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
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
CREATE TABLE "whatsapp_application_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_phone" varchar(20) NOT NULL,
	"wallet" varchar(42),
	"current_step" integer DEFAULT 0 NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_application_states_user_phone_unique" UNIQUE("user_phone")
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
CREATE TABLE "whatsapp_preapply_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_phone" varchar(20) NOT NULL,
	"step" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"applicant_name" varchar(256),
	"applicant_email" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "account_recovery_tokens" ADD CONSTRAINT "account_recovery_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_activities" ADD CONSTRAINT "dao_activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_activity_submissions" ADD CONSTRAINT "dao_activity_submissions_activity_id_dao_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."dao_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_posts" ADD CONSTRAINT "dao_posts_thread_id_dao_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."dao_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_profiles" ADD CONSTRAINT "gamification_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_events" ADD CONSTRAINT "governance_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_executions" ADD CONSTRAINT "marketing_executions_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pbox_claims" ADD CONSTRAINT "pbox_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
CREATE UNIQUE INDEX "auth_challenges_address_idx" ON "auth_challenges" USING btree ("address");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_vote" ON "governance_votes" USING btree ("proposal_id","voter_address");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_achievement" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_referral" ON "user_referrals" USING btree ("referrer_wallet_address","referred_wallet_address");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_whatsapp_lead_phone" ON "whatsapp_preapply_leads" USING btree ("user_phone");