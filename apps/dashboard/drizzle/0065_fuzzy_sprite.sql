CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'starting', 'live', 'ended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('host', 'co_host', 'participant', 'guest');--> statement-breakpoint
CREATE TYPE "public"."participant_type" AS ENUM('collaborator', 'external_guest', 'anonymous_guest');--> statement-breakpoint
CREATE TABLE "meeting_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"identity_id" varchar(255),
	"participant_type" "participant_type" DEFAULT 'anonymous_guest' NOT NULL,
	"role" "participant_role" DEFAULT 'guest' NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now(),
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"canonical_org_id" text NOT NULL,
	"appointment_id" text,
	"host_collaborator_id" varchar(255) NOT NULL,
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_appointment_id_scheduling_bookings_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."scheduling_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_collaborator_id_users_id_fk" FOREIGN KEY ("host_collaborator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;