-- 0094: email de participantes, deal room por reunión y estado de presentación.
ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "email" varchar(255);
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "deal_room_id" text;

CREATE TABLE IF NOT EXISTS "meeting_presentation_state" (
  "meeting_id" text PRIMARY KEY,
  "presentation_id" text NOT NULL,
  "slide_index" integer NOT NULL DEFAULT 0,
  "updated_by" text,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
