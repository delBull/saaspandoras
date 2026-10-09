DO $$ BEGIN
 CREATE TYPE "public"."hermes_meeting_platform" AS ENUM('GOOGLE_MEET', 'JITSI', 'ZOOM', 'TEAMS', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hermes_meetings" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"platform" "hermes_meeting_platform" DEFAULT 'OTHER' NOT NULL,
	"join_url" varchar(1024),
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"organizer_email" varchar(256),
	"attendees" jsonb,
	"status" varchar(64) DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hermes_briefing_preferences" (
	"organization_id" varchar(256) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"channel" varchar(64) DEFAULT 'EMAIL' NOT NULL,
	"lead_time_minutes" integer DEFAULT 30 NOT NULL,
	"target_emails" jsonb,
	"target_phones" jsonb,
	"include_facts" boolean DEFAULT true NOT NULL,
	"include_financials" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hermes_briefings" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"meeting_id" varchar(128) NOT NULL,
	"channel" varchar(64) NOT NULL,
	"destination" varchar(256) NOT NULL,
	"status" varchar(64) DEFAULT 'PENDING' NOT NULL,
	"error_reason" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
