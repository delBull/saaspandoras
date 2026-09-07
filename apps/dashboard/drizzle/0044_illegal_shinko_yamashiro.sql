CREATE TABLE "hermes_agent_prompts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"prompt_name" varchar(255) NOT NULL,
	"content" text,
	"ipfs_cid" varchar(255),
	"ipfs_uri" varchar(512),
	"author_agent_id" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_agent_skills" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"capability_name" varchar(255) NOT NULL,
	"description" text,
	"payload" jsonb,
	"ipfs_cid" varchar(255),
	"ipfs_uri" varchar(512),
	"author_agent_id" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hermes_agent_prompts_name_idx" ON "hermes_agent_prompts" USING btree ("prompt_name");--> statement-breakpoint
CREATE INDEX "hermes_agent_prompts_author_idx" ON "hermes_agent_prompts" USING btree ("author_agent_id");--> statement-breakpoint
CREATE INDEX "hermes_agent_skills_capability_idx" ON "hermes_agent_skills" USING btree ("capability_name");--> statement-breakpoint
CREATE INDEX "hermes_agent_skills_author_idx" ON "hermes_agent_skills" USING btree ("author_agent_id");