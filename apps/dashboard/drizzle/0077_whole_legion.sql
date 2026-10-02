ALTER TABLE "meetings" DROP CONSTRAINT "meetings_host_collaborator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "host_collaborator_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "host_collaborator_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_collaborator_id_nexus_collaborators_id_fk" FOREIGN KEY ("host_collaborator_id") REFERENCES "public"."nexus_collaborators"("id") ON DELETE no action ON UPDATE no action;