ALTER TYPE "public"."marketing_lead_status" ADD VALUE 'hot' BEFORE 'archived';--> statement-breakpoint
ALTER TYPE "public"."marketing_lead_status" ADD VALUE 'cold' BEFORE 'archived';--> statement-breakpoint
ALTER TYPE "public"."marketing_lead_status" ADD VALUE 'frio' BEFORE 'archived';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "whatsapp_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "legal_config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "token_id" varchar(255);--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "agreement_hash" text;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "agreement_id" varchar(255);--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "legal_portal_url" text;