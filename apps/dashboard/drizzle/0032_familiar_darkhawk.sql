CREATE TABLE "deal_envelopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(256) NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"document_hash" varchar(64) NOT NULL,
	"canonical_document_cid" varchar(255) NOT NULL,
	"backup_document_cid" varchar(255),
	"document_version" integer DEFAULT 1 NOT NULL,
	"document_size" integer NOT NULL,
	"mime_type" varchar(50) DEFAULT 'application/pdf' NOT NULL,
	"signing_policy" varchar(50) DEFAULT 'PARALLEL' NOT NULL,
	"threshold_m" integer,
	"signers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"evidence_package_cid" varchar(255),
	"blockchain_evidence" jsonb,
	"preservation_evidence" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "deal_envelopes" ADD CONSTRAINT "deal_envelopes_organization_id_projects_slug_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deal_envelopes_org_status_idx" ON "deal_envelopes" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "deal_envelopes_doc_hash_idx" ON "deal_envelopes" USING btree ("document_hash");