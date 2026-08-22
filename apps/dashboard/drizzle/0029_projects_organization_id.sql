ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "organization_id" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
UPDATE "projects" SET "organization_id" = gen_random_uuid() WHERE "organization_id" IS NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "projects_organization_id_unique" ON "projects" ("organization_id");--> statement-breakpoint
ALTER TABLE "hermes_journeys" DROP CONSTRAINT IF EXISTS "hermes_journeys_organization_id_projects_slug_fk";--> statement-breakpoint
ALTER TABLE "hermes_actor_journeys" DROP CONSTRAINT IF EXISTS "hermes_actor_journeys_organization_id_projects_slug_fk";--> statement-breakpoint
ALTER TABLE "hermes_conversations" DROP CONSTRAINT IF EXISTS "hermes_conversations_organization_id_projects_slug_fk";--> statement-breakpoint
ALTER TABLE "hermes_conversation_messages" DROP CONSTRAINT IF EXISTS "hermes_conversation_messages_organization_id_projects_slug_fk";--> statement-breakpoint
ALTER TABLE "hermes_addon_installations" DROP CONSTRAINT IF EXISTS "hermes_addon_installations_organization_id_projects_slug_fk";--> statement-breakpoint
ALTER TABLE "hermes_addon_audit" DROP CONSTRAINT IF EXISTS "hermes_addon_audit_organization_id_projects_slug_fk";
