CREATE TYPE "public"."subscription_status" AS ENUM('active', 'grace_period', 'suspended', 'canceled', 'trialing');--> statement-breakpoint
CREATE TABLE "academy_assessments" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"candidate_id" varchar(128) NOT NULL,
	"program_id" varchar(128) NOT NULL,
	"curriculum_version" integer DEFAULT 2 NOT NULL,
	"knowledge_snapshot_hash" varchar(128) NOT NULL,
	"status" varchar(64) DEFAULT 'IN_PROGRESS' NOT NULL,
	"overall_readiness_score" integer,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evaluations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "academy_candidates" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"phone" varchar(64),
	"target_role" varchar(64) DEFAULT 'COO' NOT NULL,
	"attendance_status" varchar(64) DEFAULT 'INVITED' NOT NULL,
	"latest_attempt_id" varchar(128),
	"latest_score" integer,
	"latest_certification_id" varchar(128),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_certifications" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"candidate_id" varchar(128) NOT NULL,
	"candidate_name" varchar(256) NOT NULL,
	"assessment_id" varchar(128) NOT NULL,
	"program_id" varchar(128) NOT NULL,
	"readiness_score" integer NOT NULL,
	"competency_summary" jsonb,
	"knowledge_snapshot_hash" varchar(128),
	"curriculum_version" integer DEFAULT 2,
	"certificate_hash" varchar(128) NOT NULL,
	"issuer" varchar(256) NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "academy_invitations" (
	"token" varchar(128) PRIMARY KEY NOT NULL,
	"candidate_id" varchar(128) NOT NULL,
	"status" varchar(64) DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"grace_period_end" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_deal_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_nda_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nda_version" varchar(32) DEFAULT 'v1.0' NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"wallet" text,
	"signature" text,
	"signature_message" text,
	"signature_company" text,
	"signature_role" text,
	"first_room_id" uuid,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
ALTER TABLE "nexus_deal_rooms" ALTER COLUMN "company" SET DEFAULT 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.';--> statement-breakpoint
ALTER TABLE "nexus_deal_comments" ADD COLUMN "section_code" varchar(4) NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_deal_rooms" ADD COLUMN "title" varchar(255) DEFAULT 'Acuerdo de Colaboración' NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_deal_rooms" ADD COLUMN "nda_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_deal_rooms" ADD COLUMN "nda_phase" varchar(32) DEFAULT 'after_proposal' NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_deal_rooms" ADD COLUMN "nda_version" varchar(32) DEFAULT 'v1.0' NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus_deal_signers" ADD COLUMN "signature_company" text;--> statement-breakpoint
ALTER TABLE "nexus_deal_signers" ADD COLUMN "signature_role" text;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD COLUMN "incoming_wamid" text;--> statement-breakpoint
ALTER TABLE "academy_assessments" ADD CONSTRAINT "academy_assessments_candidate_id_academy_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."academy_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_certifications" ADD CONSTRAINT "academy_certifications_candidate_id_academy_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."academy_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_certifications" ADD CONSTRAINT "academy_certifications_assessment_id_academy_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."academy_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_invitations" ADD CONSTRAINT "academy_invitations_candidate_id_academy_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."academy_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_subscriptions" ADD CONSTRAINT "hermes_subscriptions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_deal_attachments" ADD CONSTRAINT "nexus_deal_attachments_room_id_nexus_deal_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."nexus_deal_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_nda_acceptances" ADD CONSTRAINT "nexus_nda_acceptances_first_room_id_nexus_deal_rooms_id_fk" FOREIGN KEY ("first_room_id") REFERENCES "public"."nexus_deal_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "academy_assessments_candidate_idx" ON "academy_assessments" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "academy_assessments_status_idx" ON "academy_assessments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "academy_candidates_email_idx" ON "academy_candidates" USING btree ("email");--> statement-breakpoint
CREATE INDEX "academy_candidates_status_idx" ON "academy_candidates" USING btree ("attendance_status");--> statement-breakpoint
CREATE INDEX "academy_certifications_candidate_idx" ON "academy_certifications" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "academy_certifications_assessment_idx" ON "academy_certifications" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "academy_invitations_candidate_idx" ON "academy_invitations" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "academy_invitations_status_idx" ON "academy_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hermes_subscriptions_project_idx" ON "hermes_subscriptions" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nexus_nda_email_version_idx" ON "nexus_nda_acceptances" USING btree ("email","nda_version");