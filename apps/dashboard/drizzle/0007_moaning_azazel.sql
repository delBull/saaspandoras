ALTER TYPE "public"."project_event_type" ADD VALUE 'CALENDAR' BEFORE '1ON1';--> statement-breakpoint
CREATE TABLE "project_briefings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'published' NOT NULL,
	"locale" varchar(10) DEFAULT 'es' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "selected_date_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "extra_config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "project_briefings" ADD CONSTRAINT "project_briefings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "briefing_project_slug_idx" ON "project_briefings" USING btree ("project_id","slug");