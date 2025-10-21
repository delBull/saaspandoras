-- =============================================
-- SCRIPT DE INSTALACIÓN DE GAMIFICACIÓN
-- Ejecutar en PostgreSQL (PgAdmin, psql, etc.)
-- =============================================

-- Crear tipos enum para gamificación (si no existen)
CREATE TYPE IF NOT EXISTS "achievement_type" AS ENUM('first_steps', 'investor', 'community_builder', 'tokenization_expert', 'early_adopter', 'high_roller');
CREATE TYPE IF NOT EXISTS "event_category" AS ENUM('projects', 'investments', 'community', 'learning', 'daily', 'special');
CREATE TYPE IF NOT EXISTS "event_type" AS ENUM('project_application_submitted', 'project_application_approved', 'investment_made', 'user_registered', 'daily_login', 'referral_made', 'profile_completed', 'community_post', 'course_started', 'course_completed', 'quiz_passed', 'streak_milestone', 'beta_access', 'feature_unlock', 'milestone_reached');
CREATE TYPE IF NOT EXISTS "points_category" AS ENUM('project_application', 'investment', 'daily_login', 'community', 'special_event');
CREATE TYPE IF NOT EXISTS "reward_type" AS ENUM('token_discount', 'badge', 'priority_access', 'bonus_points', 'nft');

-- Crear tablas de gamificación (si no existen)
CREATE TABLE IF NOT EXISTS "achievements" (
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

CREATE TABLE IF NOT EXISTS "gamification_profiles" (
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

CREATE TABLE IF NOT EXISTS "gamification_events" (
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

CREATE TABLE IF NOT EXISTS "user_points" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "points" integer NOT NULL,
  "reason" text NOT NULL,
  "category" "points_category" NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rewards" (
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

CREATE TABLE IF NOT EXISTS "user_achievements" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "achievement_id" integer NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "is_unlocked" boolean DEFAULT false NOT NULL,
  "unlocked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_rewards" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "reward_id" integer NOT NULL,
  "is_claimed" boolean DEFAULT false NOT NULL,
  "claimed_at" timestamp,
  "claim_transaction_id" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Crear índices y foreign keys (si no existen)
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_achievement" ON "user_achievements" USING btree ("user_id","achievement_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gamification_events_user_id_users_id_fk') THEN
    ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gamification_profiles_user_id_users_id_fk') THEN
    ALTER TABLE "gamification_profiles" ADD CONSTRAINT "gamification_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_achievements_user_id_users_id_fk') THEN
    ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_points_user_id_users_id_fk') THEN
    ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_rewards_user_id_users_id_fk') THEN
    ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

-- =============================================
-- FIN DEL SCRIPT
-- =============================================

-- Verificar que todo se creó correctamente
SELECT
  'achievements' as table_name,
  COUNT(*) as record_count
FROM achievements
UNION ALL
SELECT
  'gamification_profiles' as table_name,
  COUNT(*) as record_count
FROM gamification_profiles
UNION ALL
SELECT
  'gamification_events' as table_name,
  COUNT(*) as record_count
FROM gamification_events
UNION ALL
SELECT
  'user_points' as table_name,
  COUNT(*) as record_count
FROM user_points
UNION ALL
SELECT
  'rewards' as table_name,
  COUNT(*) as record_count
FROM rewards
UNION ALL
SELECT
  'user_achievements' as table_name,
  COUNT(*) as record_count
FROM user_achievements
UNION ALL
SELECT
  'user_rewards' as table_name,
  COUNT(*) as record_count
FROM user_rewards;