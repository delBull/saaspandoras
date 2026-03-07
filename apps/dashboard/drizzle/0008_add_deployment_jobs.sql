CREATE TYPE "public"."deployment_job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "deployment_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_slug" varchar(256) NOT NULL,
	"status" "deployment_job_status" DEFAULT 'pending' NOT NULL,
	"step" varchar(100) DEFAULT 'queued',
	"network" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "protocol_config_queues" ADD COLUMN "proposed_buyback_allocation_ratio" numeric(5, 4);--> statement-breakpoint
ALTER TABLE "protocol_configs" ADD COLUMN "buyback_allocation_ratio" numeric(5, 4) DEFAULT '1.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "deployment_jobs" ADD CONSTRAINT "deployment_jobs_project_slug_projects_slug_fk" FOREIGN KEY ("project_slug") REFERENCES "public"."projects"("slug") ON DELETE no action ON UPDATE no action;