CREATE TYPE "public"."achievement_type" AS ENUM('first_steps', 'investor', 'community_builder', 'tokenization_expert', 'early_adopter', 'high_roller');--> statement-breakpoint
CREATE TYPE "public"."business_category" AS ENUM('residential_real_estate', 'commercial_real_estate', 'tech_startup', 'renewable_energy', 'art_collectibles', 'intellectual_property', 'other');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('projects', 'investments', 'community', 'learning', 'daily', 'special');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('project_application_submitted', 'project_application_approved', 'investment_made', 'user_registered', 'daily_login', 'referral_made', 'profile_completed', 'community_post', 'course_started', 'course_completed', 'quiz_passed', 'streak_milestone', 'beta_access', 'feature_unlock', 'milestone_reached');--> statement-breakpoint
CREATE TYPE "public"."points_category" AS ENUM('project_application', 'investment', 'daily_login', 'community', 'special_event');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'pending', 'approved', 'live', 'completed', 'incomplete', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('token_discount', 'badge', 'priority_access', 'bonus_points', 'nft');--> statement-breakpoint
CREATE TYPE "public"."token_type" AS ENUM('erc20', 'erc721', 'erc1155');--> statement-breakpoint
CREATE TYPE "public"."yield_source" AS ENUM('rental_income', 'capital_appreciation', 'dividends', 'royalties', 'other');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "administrators" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"alias" varchar(100),
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"added_by" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "administrators_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "gamification_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
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
	"user_id" integer NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gamification_profiles_user_id_unique" UNIQUE("user_id")
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
	"team_members" jsonb,
	"advisors" jsonb,
	"token_distribution" jsonb,
	"contract_address" varchar(42),
	"treasury_address" varchar(42),
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
	"image_url" text,
	"socials" jsonb,
	"raised_amount" numeric(18, 2) DEFAULT '0.00',
	"returns_paid" numeric(18, 2) DEFAULT '0.00',
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"featured_button_text" varchar(100) DEFAULT 'Learn More',
	"created_at" timestamp DEFAULT now() NOT NULL,
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
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_id" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"unlocked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"category" "points_category" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reward_id" integer NOT NULL,
	"is_claimed" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp,
	"claim_transaction_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"image" text,
	"wallet_address" varchar(42),
	"has_pandoras_key" boolean DEFAULT false NOT NULL,
	"kyc_level" varchar(20) DEFAULT 'basic' NOT NULL,
	"kyc_completed" boolean DEFAULT false NOT NULL,
	"kyc_data" jsonb,
	"connection_count" integer DEFAULT 1 NOT NULL,
	"last_connection_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_profiles" ADD CONSTRAINT "gamification_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_achievement" ON "user_achievements" USING btree ("user_id","achievement_id");