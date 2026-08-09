CREATE TABLE "installed_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"pack_id" varchar(255) NOT NULL,
	"version" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"installed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mission_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mission_id" varchar(255) NOT NULL,
	"key" varchar(255) NOT NULL,
	"status" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mission_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mission_id" varchar(255) NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"phase" varchar(100) NOT NULL,
	"milestones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active_goal" varchar(255),
	"next_action" varchar(255),
	"reason" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"pack_id" varchar(255) NOT NULL,
	"pack_version" varchar(50) NOT NULL,
	"goal_id" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"current_phase" varchar(100) NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operational_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intent_id" varchar(255) NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"decision" varchar(50) NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operational_intent_governance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intent_id" varchar(255) NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"actor_id" varchar(255),
	"actor_type" varchar(50) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"aggregate_type" varchar(100) DEFAULT 'operational_intent' NOT NULL,
	"aggregate_id" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"correlation_id" varchar(255),
	"causation_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "operational_intents" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"mission_id" varchar(255) NOT NULL,
	"pack_id" varchar(255) NOT NULL,
	"pack_version" varchar(50) NOT NULL,
	"strategy_decision_id" varchar(255) NOT NULL,
	"intent_type" varchar(100) NOT NULL,
	"objective" text NOT NULL,
	"rationale" text NOT NULL,
	"constraints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approval_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'proposed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(255),
	"aggregate_type" varchar(100) NOT NULL,
	"aggregate_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "strategy_decisions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"mission_id" varchar(255) NOT NULL,
	"pack_id" varchar(255) NOT NULL,
	"pack_version" varchar(50) NOT NULL,
	"decision_type" varchar(50) NOT NULL,
	"objective" text NOT NULL,
	"reason" jsonb NOT NULL,
	"confidence" double precision,
	"workflow" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mission_events" ADD CONSTRAINT "mission_events_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_milestones" ADD CONSTRAINT "mission_milestones_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_snapshots" ADD CONSTRAINT "mission_snapshots_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_approvals" ADD CONSTRAINT "operational_approvals_intent_id_operational_intents_id_fk" FOREIGN KEY ("intent_id") REFERENCES "public"."operational_intents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "op_intent_gov_events_org_idx" ON "operational_intent_governance_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "op_intent_gov_events_intent_idx" ON "operational_intent_governance_events" USING btree ("intent_id");--> statement-breakpoint
CREATE INDEX "operational_intents_org_status_idx" ON "operational_intents" USING btree ("organization_id","status");