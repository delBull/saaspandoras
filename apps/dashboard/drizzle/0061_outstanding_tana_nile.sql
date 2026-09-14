CREATE TABLE "nexus_action_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_token" varchar(255) NOT NULL,
	"action_type" varchar(64) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"target_role" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"executed_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"executed_at" timestamp with time zone,
	CONSTRAINT "nexus_action_requests_action_token_unique" UNIQUE("action_token")
);
