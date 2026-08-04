CREATE TYPE "public"."platform_asset_type" AS ENUM('project_event', 'document', 'media', 'calculator', 'landing', 'podcast', 'keynote', 'meeting', 'link', 'other');--> statement-breakpoint
ALTER TYPE "public"."event_registration_status" ADD VALUE 'PENDING';--> statement-breakpoint
CREATE TABLE "campaign_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"asset_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_trackers" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"shortlink_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installed_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"product" varchar(50) NOT NULL,
	"product_family" varchar(50) NOT NULL,
	"plan" varchar(50) DEFAULT 'sandbox' NOT NULL,
	"status" varchar(50) DEFAULT 'trial' NOT NULL,
	"capabilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"connectors" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"runtime_manifest" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"portal_token" text,
	"portal_token_used" boolean DEFAULT false NOT NULL,
	"portal_session_token" text,
	"activated_at" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "installed_products_portal_token_unique" UNIQUE("portal_token")
);
--> statement-breakpoint
CREATE TABLE "platform_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"type" "platform_asset_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"event_id" integer,
	"version" varchar(50),
	"description" text,
	"tags" jsonb,
	"url" text,
	"thumbnail_url" text,
	"views" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"linked_campaign_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"visibility" varchar(50) DEFAULT 'public' NOT NULL,
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_registrations" DROP CONSTRAINT "event_registrations_event_id_project_events_id_fk";
--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "telegram" varchar(255);--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "wallet_address" varchar(255);--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "attest_uid" varchar(255);--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "product_family" varchar(50) DEFAULT 'INFRASTRUCTURE' NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "product" varchar(50) DEFAULT 'TOKENIZATION' NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "crm_stage" varchar(50) DEFAULT 'LEAD' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_briefings" ADD COLUMN "title_en" varchar(255);--> statement-breakpoint
ALTER TABLE "project_briefings" ADD COLUMN "subtitle_en" text;--> statement-breakpoint
ALTER TABLE "project_briefings" ADD COLUMN "blocks_en" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tenant_runtime_config" jsonb;--> statement-breakpoint
ALTER TABLE "shortlinks" ADD COLUMN "asset_id" integer;--> statement-breakpoint
ALTER TABLE "campaign_assets" ADD CONSTRAINT "campaign_assets_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_assets" ADD CONSTRAINT "campaign_assets_asset_id_platform_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."platform_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_trackers" ADD CONSTRAINT "campaign_trackers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_trackers" ADD CONSTRAINT "campaign_trackers_shortlink_id_shortlinks_id_fk" FOREIGN KEY ("shortlink_id") REFERENCES "public"."shortlinks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installed_products" ADD CONSTRAINT "installed_products_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_assets" ADD CONSTRAINT "platform_assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_assets" ADD CONSTRAINT "platform_assets_created_by_users_walletAddress_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("walletAddress") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "installed_products_project_product_idx" ON "installed_products" USING btree ("project_id","product");--> statement-breakpoint
CREATE INDEX "installed_products_status_idx" ON "installed_products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "installed_products_portal_token_idx" ON "installed_products" USING btree ("portal_token");--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_platform_assets_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."platform_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortlinks" ADD CONSTRAINT "shortlinks_asset_id_platform_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."platform_assets"("id") ON DELETE no action ON UPDATE no action;