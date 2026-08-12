ALTER TYPE "public"."nexus_deal_kind" ADD VALUE 'CHARTER';--> statement-breakpoint
ALTER TYPE "public"."nexus_deal_status" ADD VALUE 'EXECUTING' BEFORE 'EXECUTED';--> statement-breakpoint
CREATE TABLE "platform_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"identity_id" text,
	"correlation_id" text NOT NULL,
	"causation_id" text,
	"source_system" text NOT NULL,
	"source_channel" text,
	"organization_id" text,
	"project_id" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"identity_context" jsonb,
	"attribution" jsonb,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "marketing_identities" ADD COLUMN "phone" varchar(255);--> statement-breakpoint
ALTER TABLE "nexus_deal_rooms" ADD COLUMN "open_sign" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_deal_rooms" ADD COLUMN "task_ref" text;--> statement-breakpoint
ALTER TABLE "nexus_deal_rooms" ADD COLUMN "entered_into_force_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nexus_deal_signers" ADD COLUMN "signature" text;--> statement-breakpoint
ALTER TABLE "nexus_deal_signers" ADD COLUMN "signature_message" text;--> statement-breakpoint
CREATE INDEX "identities_phone_idx" ON "marketing_identities" USING btree ("phone");