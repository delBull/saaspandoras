-- Migration: Add 'creator' to achievement_type enum
-- Date: November 3, 2025

-- Create a new enum type with the updated values
CREATE TYPE "achievement_type_new" AS ENUM (
  'first_steps',
  'investor',
  'community_builder',
  'tokenization_expert',
  'early_adopter',
  'high_roller',
  'creator'
);

-- Update the column to use the new enum (no existing data to worry about)
ALTER TABLE achievements ALTER COLUMN type TYPE "achievement_type_new" USING type::text::"achievement_type_new";

-- Drop the old enum
DROP TYPE "achievement_type";

-- Rename the new enum to the original name
ALTER TYPE "achievement_type_new" RENAME TO "achievement_type";

-- Verify the enum has been updated
SELECT enum_range(NULL::achievement_type);
