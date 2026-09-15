CREATE TABLE "nexus_deep_links" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"reference_hash" varchar(64) NOT NULL,
	"canonical_org_id" varchar(128) NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" varchar(128) NOT NULL,
	"created_by" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"consumed_by_identity_id" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nexus_deep_links_reference_hash_unique" UNIQUE("reference_hash")
);
--> statement-breakpoint
CREATE TABLE "nexus_telegram_invites" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"collaborator_id" integer NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"created_by_identity_id" integer NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"consumed_by_telegram_user_id" varchar(64),
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nexus_telegram_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "public_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"canonical_org_id" varchar(256) NOT NULL,
	"landing_public_id" varchar(255) NOT NULL,
	"product_family_id" integer,
	"api_key_hash" text NOT NULL,
	"key_fingerprint" varchar(255) NOT NULL,
	"allowed_capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"knowledge_scope" varchar(50) DEFAULT 'PUBLIC_LANDING' NOT NULL,
	"rate_limit_policy" jsonb DEFAULT '{"requestsPerMinute":30,"messagesPerMinute":10}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_integrations_landing_public_id_unique" UNIQUE("landing_public_id")
);
--> statement-breakpoint
ALTER TABLE "nexus_action_requests" ADD COLUMN "target_resource" varchar(256);--> statement-breakpoint
ALTER TABLE "nexus_action_requests" ADD COLUMN "canonical_org_id" varchar(128);--> statement-breakpoint
ALTER TABLE "nexus_action_requests" ADD COLUMN "actor_identity_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_action_requests" ADD COLUMN "required_capability" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_action_requests" ADD COLUMN "result" varchar(256);--> statement-breakpoint
ALTER TABLE "nexus_action_requests" ADD COLUMN "expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_action_requests" ADD COLUMN "consumed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nexus_action_requests" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "public_integrations" ADD CONSTRAINT "public_integrations_canonical_org_id_projects_slug_fk" FOREIGN KEY ("canonical_org_id") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_action_requests" DROP COLUMN "target_role";--> statement-breakpoint
ALTER TABLE "nexus_action_requests" DROP COLUMN "executed_by";--> statement-breakpoint
ALTER TABLE "nexus_action_requests" DROP COLUMN "executed_at";