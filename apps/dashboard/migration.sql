-- Create ENUMs
DO $$ BEGIN
    CREATE TYPE "dao_activity_type" AS ENUM ('social', 'on_chain', 'content', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "dao_activity_status" AS ENUM ('active', 'paused', 'ended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "dao_activity_submission_status" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create dao_activities table
CREATE TABLE IF NOT EXISTS "dao_activities" (
    "id" SERIAL PRIMARY KEY,
    "project_id" INTEGER NOT NULL REFERENCES "projects"("id"),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "reward_amount" DECIMAL(18, 6) DEFAULT '0' NOT NULL,
    "reward_token_symbol" VARCHAR(20) DEFAULT 'PBOX' NOT NULL,
    "type" "dao_activity_type" DEFAULT 'custom' NOT NULL,
    "status" "dao_activity_status" DEFAULT 'active' NOT NULL,
    "external_link" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create dao_activity_submissions table
CREATE TABLE IF NOT EXISTS "dao_activity_submissions" (
    "id" SERIAL PRIMARY KEY,
    "activity_id" INTEGER NOT NULL REFERENCES "dao_activities"("id"),
    "user_wallet" VARCHAR(42) NOT NULL,
    "proof_data" TEXT,
    "status" "dao_activity_submission_status" DEFAULT 'pending' NOT NULL,
    "feedback" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "reviewed_at" TIMESTAMP WITH TIME ZONE
);
