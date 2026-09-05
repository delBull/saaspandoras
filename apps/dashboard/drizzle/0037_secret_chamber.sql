ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "capabilities" jsonb DEFAULT '{}'::jsonb;