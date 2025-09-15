CREATE TYPE "public"."project_status" AS ENUM('pending', 'approved', 'live', 'completed', 'rejected');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"slug" varchar(256) NOT NULL,
	"category" varchar(100),
	"description" text,
	"image_url" varchar(1024),
	"website" varchar(512),
	"socials" jsonb,
	"tokenization_type" varchar(100),
	"total_tokens" integer,
	"raised_amount" numeric(18, 2) DEFAULT '0.00',
	"target_amount" numeric(18, 2) DEFAULT '0.00',
	"apy" varchar(50),
	"returns_paid" numeric(18, 2) DEFAULT '0.00',
	"status" "project_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
