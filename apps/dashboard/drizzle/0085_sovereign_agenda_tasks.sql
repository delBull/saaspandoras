DO $$ BEGIN
 CREATE TYPE "meeting_action_item_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meeting_action_items" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"canonical_org_id" text NOT NULL,
	"task" text NOT NULL,
	"assignee_name" text,
	"assignee_identity_id" varchar(255),
	"status" "meeting_action_item_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "ai_summary" text;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
