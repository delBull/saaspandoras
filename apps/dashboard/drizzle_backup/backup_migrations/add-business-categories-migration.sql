-- Migration: Add new business categories for tokenization/blockchain
-- Date: November 3, 2025

-- Add new enum values to business_category enum
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'defi';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'gaming';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'metaverse';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'music_audio';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'sports_fan_tokens';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'education';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'healthcare';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'supply_chain';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'infrastructure';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'social_networks';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'carbon_credits';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'insurance';
ALTER TYPE "public"."business_category" ADD VALUE IF NOT EXISTS 'prediction_markets';

-- Verify the enum has been updated
SELECT enum_range(NULL::business_category);
