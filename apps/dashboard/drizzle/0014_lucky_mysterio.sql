CREATE TABLE "compiled_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"checksum" varchar(100) NOT NULL,
	"version" varchar(50) NOT NULL,
	"uri" varchar(500) NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_jobs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"state" varchar(50) NOT NULL,
	"request" jsonb NOT NULL,
	"result" jsonb,
	"callback_secret" varchar(255),
	"provider_id" varchar(255),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_journal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar(255) NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"capability" varchar(255) NOT NULL,
	"execution_status" varchar(50) NOT NULL,
	"artifacts_generated" integer DEFAULT 0,
	"resolved_binding" jsonb,
	"resolved_provider" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compiled_artifacts" ADD CONSTRAINT "compiled_artifacts_tenant_id_projects_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;