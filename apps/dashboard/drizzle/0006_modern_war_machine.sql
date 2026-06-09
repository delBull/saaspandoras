CREATE TYPE "public"."event_registration_status" AS ENUM('CONFIRMED', 'CANCELLED', 'ATTENDED');--> statement-breakpoint
CREATE TYPE "public"."project_event_type" AS ENUM('MACRO', '1ON1');--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"telefono" varchar(50) NOT NULL,
	"perfil" varchar(100),
	"monto_interes" varchar(100),
	"status" "event_registration_status" DEFAULT 'CONFIRMED' NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"type" "project_event_type" DEFAULT 'MACRO' NOT NULL,
	"title" varchar(255) NOT NULL,
	"date" timestamp with time zone,
	"location" varchar(255),
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_project_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."project_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;