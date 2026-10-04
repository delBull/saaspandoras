CREATE TYPE "public"."nexus_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TABLE "nexus_approvals" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"canonical_org_id" varchar(256) NOT NULL,
	"action_token" varchar(512) NOT NULL,
	"proposer_id" integer,
	"proposer_name" varchar(256) NOT NULL,
	"what" text NOT NULL,
	"why" text NOT NULL,
	"resource_scope" varchar(256) NOT NULL,
	"capability_required" varchar(128) NOT NULL,
	"risk_level" varchar(32) DEFAULT 'LOW' NOT NULL,
	"status" "nexus_approval_status" DEFAULT 'PENDING' NOT NULL,
	"next_action" varchar(256),
	"resolved_by" integer,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nexus_approvals_action_token_unique" UNIQUE("action_token")
);
--> statement-breakpoint
CREATE TABLE "nexus_incidents" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"canonical_org_id" varchar(256) NOT NULL,
	"title" varchar(256) NOT NULL,
	"source" varchar(64) NOT NULL,
	"severity" varchar(64) NOT NULL,
	"status" varchar(64) DEFAULT 'OPEN' NOT NULL,
	"details" text NOT NULL,
	"resolved_by" integer,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nexus_collaborators" ADD COLUMN "canonical_org_id" varchar(256) DEFAULT 'pandoras' NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_approvals" ADD CONSTRAINT "nexus_approvals_proposer_id_nexus_collaborators_id_fk" FOREIGN KEY ("proposer_id") REFERENCES "public"."nexus_collaborators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_approvals" ADD CONSTRAINT "nexus_approvals_resolved_by_nexus_collaborators_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."nexus_collaborators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_incidents" ADD CONSTRAINT "nexus_incidents_resolved_by_nexus_collaborators_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."nexus_collaborators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_presence" ADD CONSTRAINT "nexus_presence_collaborator_id_unique" UNIQUE("collaborator_id");