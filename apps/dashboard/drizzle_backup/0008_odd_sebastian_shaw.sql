ALTER TABLE "User" ADD COLUMN "kycLevel" varchar(20) DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "kycCompleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "kycData" jsonb;