CREATE TYPE "public"."nexus_broadcast_target" AS ENUM('GLOBAL', 'USER', 'ROLE');--> statement-breakpoint
CREATE TYPE "public"."nexus_broadcast_type" AS ENUM('ANNOUNCEMENT', 'ALERT', 'UPDATE', 'URGENT');--> statement-breakpoint
CREATE TABLE "nexus_broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(256) NOT NULL,
	"content" text NOT NULL,
	"type" "nexus_broadcast_type" DEFAULT 'ANNOUNCEMENT' NOT NULL,
	"target_type" "nexus_broadcast_target" DEFAULT 'GLOBAL' NOT NULL,
	"target_user_id" varchar(256),
	"target_email" varchar(255),
	"target_role" varchar(64),
	"author_name" varchar(128) DEFAULT 'Nexus Ops' NOT NULL,
	"author_email" varchar(255),
	"author_role" varchar(64),
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
