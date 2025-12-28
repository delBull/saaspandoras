
-- Migration: Add Sovereign Scheduler Tables

-- 1. Create Enum
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'rescheduled');

-- 2. Create Slots Table
CREATE TABLE IF NOT EXISTS "scheduling_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"is_booked" boolean DEFAULT false NOT NULL,
	"type" varchar(50) DEFAULT '30_min' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Create Bookings Table
CREATE TABLE IF NOT EXISTS "scheduling_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"slot_id" text NOT NULL,
	"lead_name" text NOT NULL,
	"lead_email" text NOT NULL,
	"lead_phone" text,
	"notification_preference" varchar(20) DEFAULT 'email' NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"meeting_link" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text
);

-- 4. Add Foreign Keys
DO $$ BEGIN
 ALTER TABLE "scheduling_slots" ADD CONSTRAINT "scheduling_slots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "scheduling_bookings" ADD CONSTRAINT "scheduling_bookings_slot_id_scheduling_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."scheduling_slots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
