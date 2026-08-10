-- Deal Room: categoría CHARTER + estado EXECUTING + vínculo a tarea Operations + entrada en vigor + firma online
ALTER TYPE "nexus_deal_kind" ADD VALUE IF NOT EXISTS 'CHARTER';
ALTER TYPE "nexus_deal_status" ADD VALUE IF NOT EXISTS 'EXECUTING';
ALTER TABLE "nexus_deal_rooms" ADD COLUMN IF NOT EXISTS "task_ref" text;
ALTER TABLE "nexus_deal_rooms" ADD COLUMN IF NOT EXISTS "entered_into_force_at" timestamp with time zone;
ALTER TABLE "nexus_deal_rooms" ADD COLUMN IF NOT EXISTS "open_sign" boolean NOT NULL DEFAULT false;
