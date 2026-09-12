-- Migration: 0057_nexus_deal_rooms_sharing
-- Adds created_by and shared_with to nexus_deal_rooms for multi-collaborator isolation and granular sharing

ALTER TABLE "nexus_deal_rooms" ADD COLUMN IF NOT EXISTS "created_by" text;
ALTER TABLE "nexus_deal_rooms" ADD COLUMN IF NOT EXISTS "shared_with" jsonb DEFAULT '[]'::jsonb NOT NULL;

-- Backfill created_by from historical audit events for existing rooms
UPDATE "nexus_deal_rooms"
SET "created_by" = COALESCE(
  (
    SELECT "actor" 
    FROM "nexus_deal_audit_events" 
    WHERE "room_id" = "nexus_deal_rooms"."id" 
      AND "action" IN ('Room created', 'ROOM_CREATED') 
    ORDER BY "at" ASC 
    LIMIT 1
  ),
  'Nexus Ops'
)
WHERE "created_by" IS NULL;
