CREATE TABLE "hermes_artifacts" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"artifact_id" varchar(128) NOT NULL,
	"tenant_id" varchar(128) NOT NULL,
	"source_agent" varchar(64) DEFAULT 'sofia' NOT NULL,
	"producer" varchar(64) DEFAULT 'pixel',
	"artifact_type" varchar(64) NOT NULL,
	"title" varchar(256),
	"cid" varchar(256) NOT NULL,
	"ipfs_uri" varchar(512),
	"sha256" varchar(128) NOT NULL,
	"mime_type" varchar(128) DEFAULT 'image/png' NOT NULL,
	"size_bytes" integer,
	"provenance_json" jsonb,
	"metadata_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_capability_grants" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"grant_id" varchar(128) NOT NULL,
	"tenant_id" varchar(128) NOT NULL,
	"issuer_agent_id" varchar(64) DEFAULT 'pandoras' NOT NULL,
	"grantee_agent_id" varchar(64) DEFAULT 'sofia' NOT NULL,
	"capability" varchar(128) NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"constraints_json" jsonb,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_by" varchar(128),
	"updated_by" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_media_requests" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"request_id" varchar(128) NOT NULL,
	"correlation_id" varchar(128),
	"tenant_id" varchar(128) NOT NULL,
	"capability" varchar(128) NOT NULL,
	"requested_by" varchar(128),
	"provider" varchar(64) DEFAULT 'sofia',
	"status" varchar(32) DEFAULT 'REQUESTED' NOT NULL,
	"prompt" text,
	"brief_json" jsonb,
	"artifact_id" varchar(128),
	"failure_code" varchar(64),
	"failure_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "hermes_artifacts_tt_idx" ON "hermes_artifacts" USING btree ("tenant_id","artifact_type");--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_artifacts_tenant_cid_unique" ON "hermes_artifacts" USING btree ("tenant_id","cid");--> statement-breakpoint
CREATE INDEX "hermes_cap_grant_tcs_idx" ON "hermes_capability_grants" USING btree ("tenant_id","capability","status");--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_cap_grant_id_unique" ON "hermes_capability_grants" USING btree ("grant_id");--> statement-breakpoint
CREATE INDEX "hermes_media_req_ts_idx" ON "hermes_media_requests" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "hermes_media_req_id_unique" ON "hermes_media_requests" USING btree ("request_id");