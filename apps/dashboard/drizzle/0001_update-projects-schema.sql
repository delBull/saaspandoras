CREATE TYPE "public"."business_category" AS ENUM('residential_real_estate', 'commercial_real_estate', 'tech_startup', 'renewable_energy', 'art_collectibles', 'intellectual_property', 'other');--> statement-breakpoint
CREATE TYPE "public"."token_type" AS ENUM('erc20', 'erc721', 'erc1155');--> statement-breakpoint
CREATE TYPE "public"."yield_source" AS ENUM('rental_income', 'capital_appreciation', 'dividends', 'royalties', 'other');--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "target_amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "logo_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_photo_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tagline" varchar(140);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "business_category" "business_category" DEFAULT 'other';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "video_pitch" varchar(512);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "whitepaper_url" varchar(512);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "twitter_url" varchar(512);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "discord_url" varchar(512);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "telegram_url" varchar(512);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "linkedin_url" varchar(512);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "total_valuation_usd" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "token_type" "token_type" DEFAULT 'erc20';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tokens_offered" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "token_price_usd" numeric(18, 6);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "estimated_apy" varchar(50);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "yield_source" "yield_source" DEFAULT 'other';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "lockup_period" varchar(100);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "fund_usage" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "team_members" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "advisors" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "token_distribution" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "contract_address" varchar(42);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "treasury_address" varchar(42);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "legal_status" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "valuation_document_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "fiduciary_entity" varchar(256);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "due_diligence_report_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_mintable" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_mutable" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "update_authority_address" varchar(42);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "applicant_name" varchar(256);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "applicant_position" varchar(256);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "applicant_email" varchar(256);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "applicant_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "verification_agreement" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "tokenization_type";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "apy";