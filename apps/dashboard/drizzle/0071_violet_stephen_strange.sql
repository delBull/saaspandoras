CREATE TYPE "public"."hermes_checkpoint_status" AS ENUM('PENDING_APPROVAL', 'RESUMED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "hermes_execution_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"session_id" varchar(256) NOT NULL,
	"actor_id" varchar(256) NOT NULL,
	"current_stage_id" varchar(256) NOT NULL,
	"state_payload" jsonb NOT NULL,
	"operational_intent_id" varchar(255),
	"status" "hermes_checkpoint_status" DEFAULT 'PENDING_APPROVAL' NOT NULL,
	"state_integrity_hash" varchar(64) NOT NULL,
	"ipfs_cid" varchar(128),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resumed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "hermes_execution_checkpoints" ADD CONSTRAINT "hermes_execution_checkpoints_operational_intent_id_operational_intents_id_fk" FOREIGN KEY ("operational_intent_id") REFERENCES "public"."operational_intents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hermes_checkpoints_org_sess_idx" ON "hermes_execution_checkpoints" USING btree ("organization_id","session_id");--> statement-breakpoint
CREATE INDEX "hermes_checkpoints_org_status_idx" ON "hermes_execution_checkpoints" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "hermes_checkpoints_intent_idx" ON "hermes_execution_checkpoints" USING btree ("operational_intent_id");--> statement-breakpoint
CREATE INDEX "hermes_checkpoints_expiry_idx" ON "hermes_execution_checkpoints" USING btree ("expires_at","status");