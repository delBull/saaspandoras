CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TYPE "public"."inventory_status" AS ENUM('HELD', 'LISTED', 'SOLD');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('ACTIVE', 'SOLD', 'CANCELLED', 'ROFR_PENDING');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('ACTIVE', 'RELEASED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "action_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"correlation_id" varchar(255) NOT NULL,
	"action_type" varchar(255) NOT NULL,
	"protocol_id" integer,
	"artifact_id" varchar(255),
	"user_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agora_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" integer NOT NULL,
	"artifact_id" varchar(255) NOT NULL,
	"seller_telegram_id" varchar(255) NOT NULL,
	"price" numeric(24, 8) NOT NULL,
	"status" "listing_status" DEFAULT 'ACTIVE' NOT NULL,
	"idempotency_key" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agora_listings_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "buyback_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" integer NOT NULL,
	"artifact_id" varchar(255) NOT NULL,
	"reserved_amount" numeric(24, 8) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "reservation_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyback_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid NOT NULL,
	"listing_id" uuid,
	"artifact_id" varchar(255) NOT NULL,
	"amount_paid" numeric(24, 8) NOT NULL,
	"acquisition_type" varchar(50) NOT NULL,
	"correlation_id" varchar(255),
	"processed_by" varchar(255),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pandora_buyback_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" integer NOT NULL,
	"allocated_capital" numeric(24, 8) NOT NULL,
	"available_capital" numeric(24, 8) NOT NULL,
	"target_reserve_ratio" numeric(5, 4) NOT NULL,
	"last_rebalance_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pandora_buyback_pools_protocol_id_unique" UNIQUE("protocol_id")
);
--> statement-breakpoint
CREATE TABLE "pandora_inventories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_id" varchar(255) NOT NULL,
	"protocol_id" integer NOT NULL,
	"acquisition_type" varchar(50) NOT NULL,
	"acquisition_nav" numeric(24, 8) NOT NULL,
	"acquisition_price" numeric(24, 8) NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"relist_eligible_at" timestamp with time zone,
	"status" "inventory_status" DEFAULT 'HELD' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pandora_inventories_artifact_id_unique" UNIQUE("artifact_id")
);
--> statement-breakpoint
CREATE TABLE "protocol_navs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" integer NOT NULL,
	"nav" numeric(24, 8) NOT NULL,
	"treasury" numeric(24, 8) NOT NULL,
	"supply" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agora_listings" ADD CONSTRAINT "agora_listings_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyback_reservations" ADD CONSTRAINT "buyback_reservations_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyback_transactions" ADD CONSTRAINT "buyback_transactions_pool_id_pandora_buyback_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pandora_buyback_pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyback_transactions" ADD CONSTRAINT "buyback_transactions_listing_id_agora_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."agora_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pandora_buyback_pools" ADD CONSTRAINT "pandora_buyback_pools_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pandora_inventories" ADD CONSTRAINT "pandora_inventories_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_navs" ADD CONSTRAINT "protocol_navs_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agora_listings_protocol_idx" ON "agora_listings" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "protocol_navs_idx" ON "protocol_navs" USING btree ("protocol_id","created_at");