ALTER TABLE "scheduling_slots" ADD COLUMN IF NOT EXISTS "reserved_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "scheduling_slots" ADD COLUMN IF NOT EXISTS "reserved_by" varchar(255);
