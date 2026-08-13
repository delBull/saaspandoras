CREATE TABLE IF NOT EXISTS "hermes_addons" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"version" varchar(50) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hermes_addon_installations" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"addon_id" varchar(256) NOT NULL,
	"version" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"installed_by" varchar(256) NOT NULL,
	"approved_by" varchar(256),
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hermes_addon_audit" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"addon_id" varchar(256) NOT NULL,
	"installation_id" varchar(256) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"actor_id" varchar(256) NOT NULL,
	"actor_type" varchar(50) NOT NULL,
	"old_status" varchar(50),
	"new_status" varchar(50) NOT NULL,
	"version" varchar(50) NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hermes_addon_installations" ADD CONSTRAINT "hermes_addon_installations_organization_id_projects_slug_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hermes_addon_installations" ADD CONSTRAINT "hermes_addon_installations_addon_id_hermes_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."hermes_addons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hermes_addon_audit" ADD CONSTRAINT "hermes_addon_audit_organization_id_projects_slug_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_addon_install_tenant_idx" ON "hermes_addon_installations" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hermes_addon_install_unique" ON "hermes_addon_installations" USING btree ("organization_id","addon_id") WHERE status != 'DEACTIVATED';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_addon_audit_tenant_idx" ON "hermes_addon_audit" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_addon_audit_installation_idx" ON "hermes_addon_audit" USING btree ("installation_id");
