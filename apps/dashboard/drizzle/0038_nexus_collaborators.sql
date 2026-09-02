CREATE TABLE IF NOT EXISTS "nexus_collaborators" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_access_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nexus_collaborators_email_unique" UNIQUE("email"),
	CONSTRAINT "nexus_collaborators_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nexus_collaborators_email_unique" ON "nexus_collaborators" USING btree ("email");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nexus_collaborators_token_unique" ON "nexus_collaborators" USING btree ("token");
