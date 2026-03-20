CREATE TYPE "public"."lead_attribution_method" AS ENUM('domain_match', 'fingerprint_match', 'email_match', 'manual');--> statement-breakpoint
CREATE TYPE "public"."lead_attribution_type" AS ENUM('exclusive', 'shared');--> statement-breakpoint
CREATE TABLE "marketing_lead_attributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"project_id" integer NOT NULL,
	"attribution_type" "lead_attribution_type" DEFAULT 'shared' NOT NULL,
	"attribution_method" "lead_attribution_method" NOT NULL,
	"confidence_score" numeric(3, 2) NOT NULL,
	"attributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_metrics" ALTER COLUMN "recipient" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "allowed_domains" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_lead_attributions" ADD CONSTRAINT "marketing_lead_attributions_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_lead_attributions" ADD CONSTRAINT "marketing_lead_attributions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_lead_project_unique_idx" ON "marketing_lead_attributions" USING btree ("lead_id","project_id");--> statement-breakpoint
CREATE INDEX "attribution_lead_idx" ON "marketing_lead_attributions" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "attribution_project_idx" ON "marketing_lead_attributions" USING btree ("project_id");