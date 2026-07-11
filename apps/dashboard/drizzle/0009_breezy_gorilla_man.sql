CREATE TYPE "public"."document_category" AS ENUM('project_overview', 'legal_asset_protection', 'financial_model', 'development_progress', 'technology_security', 'investor_education');--> statement-breakpoint
CREATE TYPE "public"."document_file_type" AS ENUM('pdf', 'external_link');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('AVAILABLE', 'REGULATORY_PROCESS', 'IN_PROGRESS', 'UNDER_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('marketing', 'disclosure', 'legal', 'technical', 'financial', 'operational', 'educational', 'certification');--> statement-breakpoint
CREATE TYPE "public"."document_verification_status" AS ENUM('NOT_VERIFIED', 'INTERNAL_REVIEW', 'VERIFIED', 'EXTERNAL_VERIFIED');--> statement-breakpoint
CREATE TYPE "public"."document_visibility" AS ENUM('PUBLIC', 'PARTNER', 'REGISTERED_USER', 'INVESTOR', 'ADMIN');--> statement-breakpoint
CREATE TABLE "buyback_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"wallet" varchar(255) NOT NULL,
	"amount_requested" varchar(255),
	"reason" text,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"document_type" "document_type" NOT NULL,
	"category" "document_category" NOT NULL,
	"file_type" "document_file_type" DEFAULT 'external_link' NOT NULL,
	"file_url" text NOT NULL,
	"storage_provider" varchar(50) DEFAULT 'external' NOT NULL,
	"version" varchar(50) DEFAULT '1.0' NOT NULL,
	"status" "document_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"verification_status" "document_verification_status" DEFAULT 'NOT_VERIFIED' NOT NULL,
	"visibility" "document_visibility" DEFAULT 'ADMIN' NOT NULL,
	"uploaded_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_identities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"wallet_address" varchar(42),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_username" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_language" varchar(10);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_joined_at" timestamp;--> statement-breakpoint
ALTER TABLE "buyback_requests" ADD CONSTRAINT "buyback_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_documents_project_idx" ON "project_documents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_documents_visibility_idx" ON "project_documents" USING btree ("visibility");