CREATE TABLE "nexus_audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_identity_id" integer NOT NULL,
	"canonical_org_id" varchar(128) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"resource_type" varchar(64) NOT NULL,
	"resource_id" varchar(128) NOT NULL,
	"action" varchar(64) NOT NULL,
	"previous_state" jsonb,
	"new_state" jsonb,
	"result" varchar(64) NOT NULL,
	"correlation_id" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
