CREATE TABLE "hermes_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"hmac_secret_hash" text NOT NULL,
	"wallet_address" varchar(255),
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hermes_agents_agent_id_unique" UNIQUE("agent_id")
);
