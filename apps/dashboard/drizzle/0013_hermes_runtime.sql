CREATE TABLE "conversation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer NOT NULL,
	"lead_id" uuid,
	"channel" varchar(50) NOT NULL,
	"contact_context" jsonb DEFAULT '{}'::jsonb,
	"journey_id" varchar(100),
	"current_stage" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "golden_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" integer NOT NULL,
	"slug" varchar(150) NOT NULL,
	"channel" varchar(50),
	"referrer_id" varchar(100),
	"relationship_override" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "golden_links_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hermes_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer NOT NULL,
	"session_id" uuid,
	"lead_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "installed_products" ADD COLUMN "pack_id" varchar(100);--> statement-breakpoint
ALTER TABLE "installed_products" ADD COLUMN "version" varchar(50) DEFAULT '1.0.0';--> statement-breakpoint
ALTER TABLE "installed_products" ADD COLUMN "migrations_version" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "source" varchar(255);--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "contact_context" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_tenant_id_projects_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "golden_links" ADD CONSTRAINT "golden_links_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_events" ADD CONSTRAINT "hermes_events_tenant_id_projects_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_events" ADD CONSTRAINT "hermes_events_session_id_conversation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_events" ADD CONSTRAINT "hermes_events_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;