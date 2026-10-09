DO $$ BEGIN
 CREATE TYPE "public"."meeting_follow_up_status" AS ENUM('pending', 'sent', 'no_action');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "jitsi_room_id" text;
--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "presentation_id" text;
--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD COLUMN "follow_up_status" "meeting_follow_up_status" DEFAULT 'pending' NOT NULL;
