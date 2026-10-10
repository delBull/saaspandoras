DO $$ BEGIN
 CREATE TYPE "commercial_order_status" AS ENUM('PENDING_PAYMENT', 'PENDING_APPROVAL', 'PAID', 'PROVISIONING', 'PROVISIONED', 'REJECTED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commercial_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_key" varchar(50) NOT NULL,
	"price_version" varchar(50) NOT NULL,
	"unit_price" numeric(18, 2) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commercial_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"total_amount" numeric(18, 2) NOT NULL,
	"status" "commercial_order_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"requested_org_name" varchar(255) NOT NULL,
	"requested_org_slug" varchar(255) NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"verified_by" varchar(255),
	"verified_at" timestamp with time zone,
	"provisioned_project_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commercial_orders_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commercial_orders_active_idx" ON "commercial_orders" ("lead_id") WHERE status IN ('PENDING_PAYMENT', 'PENDING_APPROVAL', 'PAID', 'PROVISIONING');--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commercial_order_lines" ADD CONSTRAINT "commercial_order_lines_order_id_commercial_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "commercial_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commercial_orders" ADD CONSTRAINT "commercial_orders_lead_id_marketing_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "marketing_leads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commercial_orders" ADD CONSTRAINT "commercial_orders_provisioned_project_id_projects_id_fk" FOREIGN KEY ("provisioned_project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
