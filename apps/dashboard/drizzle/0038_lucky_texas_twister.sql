CREATE TABLE "project_collaborators" (
	"project_id" varchar(256) NOT NULL,
	"collaborator_id" integer NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_collaborators_project_id_collaborator_id_pk" PRIMARY KEY("project_id","collaborator_id")
);
--> statement-breakpoint
ALTER TABLE "hermes_conversations" ADD COLUMN "assigned_collaborator_id" integer;--> statement-breakpoint
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_project_id_projects_slug_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_collaborator_id_nexus_collaborators_id_fk" FOREIGN KEY ("collaborator_id") REFERENCES "public"."nexus_collaborators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hermes_conversations" ADD CONSTRAINT "hermes_conversations_assigned_collaborator_id_nexus_collaborators_id_fk" FOREIGN KEY ("assigned_collaborator_id") REFERENCES "public"."nexus_collaborators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "capabilities";