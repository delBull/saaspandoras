CREATE TYPE "public"."ambassador_role" AS ENUM('GROWTH_PARTNER', 'SENIOR_PARTNER', 'INSTITUTIONAL_PARTNER', 'INTERNAL');--> statement-breakpoint
ALTER TYPE "public"."commission_status" ADD VALUE 'qualified' BEFORE 'paid';--> statement-breakpoint
ALTER TYPE "public"."commission_status" ADD VALUE 'reserved' BEFORE 'paid';--> statement-breakpoint
ALTER TYPE "public"."commission_status" ADD VALUE 'invested' BEFORE 'paid';--> statement-breakpoint
ALTER TYPE "public"."commission_status" ADD VALUE 'approved' BEFORE 'paid';--> statement-breakpoint
CREATE TABLE "partner_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambassador_id" uuid NOT NULL,
	"course_name" varchar(255) NOT NULL,
	"academy_version" varchar(50) NOT NULL,
	"score" integer,
	"status" varchar(50) DEFAULT 'TRAINING' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_reputation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambassador_id" uuid NOT NULL,
	"event" varchar(255) NOT NULL,
	"points" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ambassadors" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ambassadors" ALTER COLUMN "status" SET DEFAULT 'FOUNDER'::text;--> statement-breakpoint
DROP TYPE "public"."ambassador_status";--> statement-breakpoint
CREATE TYPE "public"."ambassador_status" AS ENUM('APPLIED', 'FOUNDER', 'TRAINING', 'ACCREDITED', 'SUSPENDED');--> statement-breakpoint
ALTER TABLE "ambassadors" ALTER COLUMN "status" SET DEFAULT 'FOUNDER'::"public"."ambassador_status";--> statement-breakpoint
ALTER TABLE "ambassadors" ALTER COLUMN "status" SET DATA TYPE "public"."ambassador_status" USING "status"::"public"."ambassador_status";--> statement-breakpoint
ALTER TABLE "ambassadors" ADD COLUMN "verification_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ambassadors" ADD COLUMN "role" "ambassador_role" DEFAULT 'GROWTH_PARTNER' NOT NULL;--> statement-breakpoint
ALTER TABLE "ambassadors" ADD COLUMN "activation_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "partner_certifications" ADD CONSTRAINT "partner_certifications_ambassador_id_ambassadors_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_reputation_events" ADD CONSTRAINT "partner_reputation_events_ambassador_id_ambassadors_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_certifications_amb_idx" ON "partner_certifications" USING btree ("ambassador_id");--> statement-breakpoint
CREATE INDEX "partner_reputation_events_amb_idx" ON "partner_reputation_events" USING btree ("ambassador_id");