CREATE TABLE IF NOT EXISTS "hermes_knowledge" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"dimension" varchar(50) NOT NULL,
	"key" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"visibility" varchar(50) NOT NULL,
	"authority" varchar(50) NOT NULL,
	"version" integer NOT NULL,
	"source" varchar(50) NOT NULL,
	"source_reference" text,
	"created_by" varchar(255) NOT NULL,
	"supersedes_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hermes_governance_audit" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"knowledge_id" varchar(255) NOT NULL,
	"version" integer NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_type" varchar(50) NOT NULL,
	"old_status" varchar(50),
	"new_status" varchar(50) NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_knowledge_tds_idx" ON "hermes_knowledge" ("organization_id","dimension","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hermes_knowledge_unique_active" ON "hermes_knowledge" ("organization_id","dimension","key") WHERE status = 'ACTIVE';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_audit_tenant_idx" ON "hermes_governance_audit" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hermes_audit_knowledge_idx" ON "hermes_governance_audit" ("knowledge_id");
