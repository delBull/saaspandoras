CREATE TABLE "nexus_deal_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"author" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nexus_deal_comments" ADD CONSTRAINT "nexus_deal_comments_room_id_nexus_deal_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."nexus_deal_rooms"("id") ON DELETE cascade ON UPDATE no action;