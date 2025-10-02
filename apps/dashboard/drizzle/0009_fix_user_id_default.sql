-- Migration: Add UUID default to User.id field
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "User"
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Normalize walletAddresses to lowercase
UPDATE "User" SET "walletAddress" = LOWER("walletAddress");

-- Create unique index on normalized walletAddress
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wallet_lower
ON "User" (LOWER("walletAddress"));
