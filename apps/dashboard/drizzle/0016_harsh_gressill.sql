ALTER TYPE "public"."commission_type" ADD VALUE 'DIRECT_SALE';--> statement-breakpoint
ALTER TYPE "public"."commission_type" ADD VALUE 'MANAGER_OVERRIDE';--> statement-breakpoint
ALTER TABLE "ambassadors" ADD COLUMN "manager_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "ambassador_commission_rate" numeric(5, 2) DEFAULT '4.00';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "manager_commission_rate" numeric(5, 2) DEFAULT '3.00';