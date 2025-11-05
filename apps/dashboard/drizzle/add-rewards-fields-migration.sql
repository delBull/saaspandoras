-- Migration: Add recurring rewards and utility fields to projects table
-- Date: November 5, 2025
-- Description: Add fields for recurring rewards system and additional utility features

-- Add recurring rewards fields
ALTER TABLE "projects" ADD COLUMN "recurring_rewards" text;

-- Add staking rewards fields
ALTER TABLE "projects" ADD COLUMN "staking_rewards_enabled" boolean DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "staking_rewards_details" text;

-- Add revenue sharing fields
ALTER TABLE "projects" ADD COLUMN "revenue_sharing_enabled" boolean DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "revenue_sharing_details" text;

-- Add work-to-earn fields
ALTER TABLE "projects" ADD COLUMN "work_to_earn_enabled" boolean DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "work_to_earn_details" text;

-- Add tiered access fields
ALTER TABLE "projects" ADD COLUMN "tiered_access_enabled" boolean DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "tiered_access_details" text;

-- Add discounted fees fields
ALTER TABLE "projects" ADD COLUMN "discounted_fees_enabled" boolean DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "discounted_fees_details" text;

-- Add integration details field
ALTER TABLE "projects" ADD COLUMN "integration_details" text;

-- Add legal entity help field
ALTER TABLE "projects" ADD COLUMN "legal_entity_help" boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN projects.recurring_rewards IS 'Description of the recurring rewards structure';
COMMENT ON COLUMN projects.staking_rewards_enabled IS 'Whether staking rewards are enabled';
COMMENT ON COLUMN projects.staking_rewards_details IS 'Details about staking rewards';
COMMENT ON COLUMN projects.revenue_sharing_enabled IS 'Whether revenue sharing is enabled';
COMMENT ON COLUMN projects.revenue_sharing_details IS 'Details about revenue sharing';
COMMENT ON COLUMN projects.work_to_earn_enabled IS 'Whether work-to-earn is enabled';
COMMENT ON COLUMN projects.work_to_earn_details IS 'Details about work-to-earn mechanism';
COMMENT ON COLUMN projects.tiered_access_enabled IS 'Whether tiered access is enabled';
COMMENT ON COLUMN projects.tiered_access_details IS 'Details about tiered access';
COMMENT ON COLUMN projects.discounted_fees_enabled IS 'Whether discounted fees are enabled';
COMMENT ON COLUMN projects.discounted_fees_details IS 'Details about discounted fees';
COMMENT ON COLUMN projects.integration_details IS 'Details about platform integrations';
COMMENT ON COLUMN projects.legal_entity_help IS 'Whether the creator needs help with legal entity setup';
