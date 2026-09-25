CREATE TABLE "hermes_canonical_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"identity_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"source" varchar(100),
	"source_type" varchar(50) NOT NULL,
	"source_conversation_id" varchar(256),
	"source_message_id" varchar(256),
	"confidence" integer,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "verified_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"verification_method" varchar(50),
	"verified_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hermes_conversations" ADD COLUMN "channel" varchar(50) DEFAULT 'WEB' NOT NULL;--> statement-breakpoint
ALTER TABLE "hermes_conversations" ALTER COLUMN "channel" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "hermes_conversations" ADD COLUMN "surface" varchar(50);--> statement-breakpoint
ALTER TABLE "hermes_canonical_memory" ADD CONSTRAINT "hermes_canonical_memory_organization_id_projects_slug_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_canonical_memory" ADD CONSTRAINT "hermes_canonical_memory_identity_id_marketing_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."marketing_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verified_identities" ADD CONSTRAINT "verified_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hermes_memory_org_ident_idx" ON "hermes_canonical_memory" USING btree ("organization_id","identity_id");--> statement-breakpoint
CREATE INDEX "hermes_memory_org_ident_status_idx" ON "hermes_canonical_memory" USING btree ("organization_id","identity_id","status");--> statement-breakpoint
CREATE INDEX "hermes_memory_type_idx" ON "hermes_canonical_memory" USING btree ("type");