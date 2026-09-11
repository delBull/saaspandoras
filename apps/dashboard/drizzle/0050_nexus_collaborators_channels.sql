ALTER TABLE "nexus_collaborators" ADD COLUMN IF NOT EXISTS "status" varchar(16) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_collaborators" ADD COLUMN IF NOT EXISTS "status_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nexus_collaborators" ADD COLUMN IF NOT EXISTS "whatsapp_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "nexus_collaborators" ADD COLUMN IF NOT EXISTS "discord_user_id" varchar(255);
