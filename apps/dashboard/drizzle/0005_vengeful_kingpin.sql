CREATE TYPE "public"."config_queue_status" AS ENUM('PENDING', 'EXECUTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"owner_id" varchar(255) NOT NULL,
	"last_listing_cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "protocol_config_queues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" integer NOT NULL,
	"proposed_fee_rate" numeric(5, 4),
	"proposed_inventory_max_ratio" numeric(5, 4),
	"proposed_settlement_paused" boolean,
	"effective_at" timestamp with time zone NOT NULL,
	"status" "config_queue_status" DEFAULT 'PENDING' NOT NULL,
	"proposed_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_configs" (
	"protocol_id" integer PRIMARY KEY NOT NULL,
	"fee_rate" numeric(5, 4) DEFAULT '0.0200' NOT NULL,
	"inventory_max_ratio" numeric(5, 4) DEFAULT '0.2500' NOT NULL,
	"settlement_paused" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "agora_listings" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "protocol_config_queues" ADD CONSTRAINT "protocol_config_queues_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_configs" ADD CONSTRAINT "protocol_configs_protocol_id_projects_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;