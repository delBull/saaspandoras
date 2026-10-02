CREATE TABLE "nexus_presence" (
	"id" serial PRIMARY KEY NOT NULL,
	"collaborator_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'OFFLINE' NOT NULL,
	"context" varchar(255),
	"preferred_channel" varchar(50) DEFAULT 'NEXUS_CHAT' NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nexus_presence" ADD CONSTRAINT "nexus_presence_collaborator_id_nexus_collaborators_id_fk" FOREIGN KEY ("collaborator_id") REFERENCES "public"."nexus_collaborators"("id") ON DELETE no action ON UPDATE no action;