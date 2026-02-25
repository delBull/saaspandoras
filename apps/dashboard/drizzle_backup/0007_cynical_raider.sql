ALTER TABLE "User" ADD COLUMN "connectionCount" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "lastConnectionAt" timestamp DEFAULT now();