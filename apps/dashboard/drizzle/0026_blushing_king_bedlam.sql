CREATE TABLE "hermes_actor_journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"actor_id" varchar(256) NOT NULL,
	"journey_id" uuid NOT NULL,
	"journey_version" integer NOT NULL,
	"current_stage_id" varchar(256) NOT NULL,
	"status" varchar(50) DEFAULT 'IN_PROGRESS' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_advanced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hermes_journey_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"order_index" integer NOT NULL,
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_journey_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"from_stage_id" varchar(256) NOT NULL,
	"to_stage_id" varchar(256) NOT NULL,
	"trigger" varchar(256),
	"condition" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hermes_actor_journeys" ADD CONSTRAINT "hermes_actor_journeys_organization_id_projects_slug_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_actor_journeys" ADD CONSTRAINT "hermes_actor_journeys_journey_id_hermes_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."hermes_journeys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_journey_stages" ADD CONSTRAINT "hermes_journey_stages_journey_id_hermes_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."hermes_journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_journey_transitions" ADD CONSTRAINT "hermes_journey_transitions_journey_id_hermes_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."hermes_journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_journeys" ADD CONSTRAINT "hermes_journeys_organization_id_projects_slug_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_actor_journeys_org_actor_idx" ON "hermes_actor_journeys" USING btree ("organization_id","actor_id") WHERE "hermes_actor_journeys"."status" = 'IN_PROGRESS';--> statement-breakpoint
CREATE INDEX "hermes_actor_journeys_journey_idx" ON "hermes_actor_journeys" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "hermes_journey_stages_journey_idx" ON "hermes_journey_stages" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "hermes_journey_transitions_journey_idx" ON "hermes_journey_transitions" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "hermes_journeys_org_idx" ON "hermes_journeys" USING btree ("organization_id");