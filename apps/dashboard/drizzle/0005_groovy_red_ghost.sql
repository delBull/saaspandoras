ALTER TYPE "public"."project_status" ADD VALUE 'draft' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'incomplete' BEFORE 'rejected';