-- Migration: Update yield_source enum for utility strategy
-- Date: November 3, 2025

-- First, we need to handle existing data that might use old enum values
-- Update any existing records with old yield_source values to 'other'
UPDATE projects
SET yield_source = 'other'
WHERE yield_source IN ('rental_income', 'capital_appreciation', 'dividends', 'royalties')
AND yield_source IS NOT NULL;

-- Create a new enum type with the updated values
CREATE TYPE "yield_source_new" AS ENUM (
  'protocol_revenue',
  'staking_rewards',
  'liquidity_mining',
  'governance_rewards',
  'utility_fees',
  'revenue_sharing',
  'other'
);

-- Update the column to use the new enum
ALTER TABLE projects ALTER COLUMN yield_source TYPE "yield_source_new" USING yield_source::text::"yield_source_new";

-- Drop the old enum
DROP TYPE "yield_source";

-- Rename the new enum to the original name
ALTER TYPE "yield_source_new" RENAME TO "yield_source";

-- Verify the enum has been updated
SELECT enum_range(NULL::yield_source);
