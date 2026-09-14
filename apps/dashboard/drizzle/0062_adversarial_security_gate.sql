ALTER TABLE "nexus_action_requests" ADD COLUMN "target_resource" varchar(256);
ALTER TABLE "nexus_action_requests" ADD COLUMN "canonical_org_id" varchar(128);
-- Empty table handling: since it's practically empty, we can safely add NOT NULL columns
ALTER TABLE "nexus_action_requests" ADD COLUMN "actor_identity_id" integer NOT NULL DEFAULT 0;
ALTER TABLE "nexus_action_requests" ADD COLUMN "required_capability" varchar(64) NOT NULL DEFAULT '';
ALTER TABLE "nexus_action_requests" ADD COLUMN "result" varchar(256);
ALTER TABLE "nexus_action_requests" ADD COLUMN "expires_at" timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE "nexus_action_requests" ADD COLUMN "consumed_at" timestamp with time zone;
ALTER TABLE "nexus_action_requests" ADD COLUMN "completed_at" timestamp with time zone;

-- Drop constraints first if any existed (just doing standard column drops)
ALTER TABLE "nexus_action_requests" DROP COLUMN IF EXISTS "target_role";
ALTER TABLE "nexus_action_requests" DROP COLUMN IF EXISTS "executed_by";
ALTER TABLE "nexus_action_requests" DROP COLUMN IF EXISTS "executed_at";

-- Remove defaults after insertion
ALTER TABLE "nexus_action_requests" ALTER COLUMN "actor_identity_id" DROP DEFAULT;
ALTER TABLE "nexus_action_requests" ALTER COLUMN "required_capability" DROP DEFAULT;
ALTER TABLE "nexus_action_requests" ALTER COLUMN "expires_at" DROP DEFAULT;