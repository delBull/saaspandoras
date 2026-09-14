ALTER TABLE "nexus_collaborators" ADD COLUMN "telegram_user_id" varchar(64);--> statement-breakpoint
ALTER TABLE "nexus_collaborators" ADD COLUMN "telegram_username" varchar(128);--> statement-breakpoint
CREATE UNIQUE INDEX "nexus_collaborators_telegram_user_id_unique" ON "nexus_collaborators" USING btree ("telegram_user_id");