CREATE TABLE "nexus_campaign_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_org_id" varchar(256) NOT NULL,
	"external_campaign_id" varchar(256),
	"name" text NOT NULL,
	"objective" varchar(100) NOT NULL,
	"pieces_count" integer DEFAULT 0 NOT NULL,
	"channels" text[] DEFAULT '{}'::text[] NOT NULL,
	"blast_radius" integer,
	"proposal_payload" jsonb,
	"status" varchar(50) DEFAULT 'PROPOSED' NOT NULL,
	"expires_at" timestamp with time zone,
	"proposed_by" varchar(256),
	"approved_by" integer,
	"approved_at" timestamp with time zone,
	"rejected_by" integer,
	"rejected_at" timestamp with time zone,
	"idempotency_key" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nexus_campaign_proposals_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "nexus_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_org_id" varchar(256) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"visibility" varchar(20) DEFAULT 'TEAM_VISIBLE' NOT NULL,
	"assignee_collaborator_id" integer,
	"created_by" integer NOT NULL,
	"due_date" timestamp with time zone,
	"claimed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nexus_campaign_proposals" ADD CONSTRAINT "nexus_campaign_proposals_approved_by_nexus_collaborators_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."nexus_collaborators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_campaign_proposals" ADD CONSTRAINT "nexus_campaign_proposals_rejected_by_nexus_collaborators_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."nexus_collaborators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_tasks" ADD CONSTRAINT "nexus_tasks_assignee_collaborator_id_nexus_collaborators_id_fk" FOREIGN KEY ("assignee_collaborator_id") REFERENCES "public"."nexus_collaborators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_tasks" ADD CONSTRAINT "nexus_tasks_created_by_nexus_collaborators_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."nexus_collaborators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_campaign_proposals_org_status" ON "nexus_campaign_proposals" USING btree ("canonical_org_id","status");--> statement-breakpoint
CREATE INDEX "idx_nexus_tasks_org_status" ON "nexus_tasks" USING btree ("canonical_org_id","status");--> statement-breakpoint
CREATE INDEX "idx_nexus_tasks_assignee" ON "nexus_tasks" USING btree ("assignee_collaborator_id","status");