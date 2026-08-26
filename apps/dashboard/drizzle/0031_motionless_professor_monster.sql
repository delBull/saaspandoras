CREATE TABLE "hermes_claim_contracts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"contract_hash" varchar(64) NOT NULL,
	"ipfs_cid" varchar(255) NOT NULL,
	"backup_ipfs_cid" varchar(255),
	"ipfs_uri" varchar(512) NOT NULL,
	"claims" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"signed_by_address" varchar(42) NOT NULL,
	"agent_signature" text NOT NULL,
	"governance_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_escalations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"conversation_id" varchar(256) NOT NULL,
	"actor_id" varchar(256),
	"channel" varchar(50) DEFAULT 'TELEGRAM' NOT NULL,
	"reason" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"resolved_by" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "hermes_identities" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"public_address" varchar(42) NOT NULL,
	"tenant_id" varchar(100) NOT NULL,
	"instance_id" varchar(100) NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"policy_hash" varchar(64) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "hermes_identities_public_address_unique" UNIQUE("public_address")
);
--> statement-breakpoint
CREATE TABLE "hermes_knowledge_registry" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"domain" varchar(100) NOT NULL,
	"artifact_id" varchar(255) NOT NULL,
	"classification" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"ciphertext_hash" varchar(64),
	"ipfs_cid" varchar(255) NOT NULL,
	"backup_ipfs_cid" varchar(255),
	"ipfs_uri" varchar(512) NOT NULL,
	"aad_binding" text,
	"merkle_root" varchar(64),
	"signed_by_address" varchar(42) NOT NULL,
	"agent_signature" text NOT NULL,
	"governance_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_security_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"actor_id" varchar(255),
	"event_type" varchar(100) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"policy_decision" varchar(50) NOT NULL,
	"correlation_id" varchar(255) NOT NULL,
	"artifact_id" varchar(255),
	"tool_id" varchar(255),
	"classification" varchar(50),
	"content_hash" varchar(128),
	"event_hash" varchar(128) NOT NULL,
	"previous_event_hash" varchar(128) NOT NULL,
	"sequence_number" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hermes_actor_journeys" DROP CONSTRAINT "hermes_actor_journeys_organization_id_projects_slug_fk";
--> statement-breakpoint
ALTER TABLE "hermes_knowledge" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "academy_certifications" ADD COLUMN "ipfs_cid" varchar(255);--> statement-breakpoint
ALTER TABLE "academy_certifications" ADD COLUMN "ipfs_uri" varchar(512);--> statement-breakpoint
ALTER TABLE "academy_certifications" ADD COLUMN "signed_by_address" varchar(42);--> statement-breakpoint
ALTER TABLE "academy_certifications" ADD COLUMN "agent_signature" text;--> statement-breakpoint
ALTER TABLE "academy_certifications" ADD COLUMN "rubric_snapshot_cid" varchar(255);--> statement-breakpoint
ALTER TABLE "hermes_conversations" ADD COLUMN "status" varchar(50) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "hermes_conversations" ADD COLUMN "escalation_reason" varchar(100);--> statement-breakpoint
ALTER TABLE "hermes_conversations" ADD COLUMN "escalated_at" timestamp;--> statement-breakpoint
ALTER TABLE "hermes_knowledge" ADD COLUMN "classification" varchar(50) DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "organization_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "hermes_escalations" ADD CONSTRAINT "hermes_escalations_organization_id_projects_slug_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_cc_tenant_version_idx" ON "hermes_claim_contracts" USING btree ("tenant_id","version");--> statement-breakpoint
CREATE INDEX "hermes_cc_cid_idx" ON "hermes_claim_contracts" USING btree ("ipfs_cid");--> statement-breakpoint
CREATE INDEX "hermes_escalations_org_status_idx" ON "hermes_escalations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "hermes_escalations_org_conv_idx" ON "hermes_escalations" USING btree ("organization_id","conversation_id");--> statement-breakpoint
CREATE INDEX "hermes_identities_tenant_idx" ON "hermes_identities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "hermes_identities_address_idx" ON "hermes_identities" USING btree ("public_address");--> statement-breakpoint
CREATE INDEX "hermes_kr_tenant_domain_idx" ON "hermes_knowledge_registry" USING btree ("tenant_id","domain","governance_status");--> statement-breakpoint
CREATE INDEX "hermes_kr_artifact_version_idx" ON "hermes_knowledge_registry" USING btree ("tenant_id","artifact_id","version");--> statement-breakpoint
CREATE INDEX "hermes_kr_cid_idx" ON "hermes_knowledge_registry" USING btree ("ipfs_cid");--> statement-breakpoint
CREATE INDEX "hermes_sec_tenant_idx" ON "hermes_security_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "hermes_sec_correlation_idx" ON "hermes_security_events" USING btree ("correlation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_sec_event_hash_unique" ON "hermes_security_events" USING btree ("event_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_sec_tenant_seq_unique" ON "hermes_security_events" USING btree ("organization_id","sequence_number");--> statement-breakpoint
CREATE INDEX "academy_certifications_ipfs_cid_idx" ON "academy_certifications" USING btree ("ipfs_cid");--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_actor_journeys_org_actor_journey_uniq" ON "hermes_actor_journeys" USING btree ("organization_id","actor_id","journey_id");--> statement-breakpoint
CREATE INDEX "hermes_conv_org_status_idx" ON "hermes_conversations" USING btree ("organization_id","status");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_unique" UNIQUE("organization_id");