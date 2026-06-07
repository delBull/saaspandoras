CREATE TYPE "public"."ambassador_origin" AS ENUM('pandoras', 'snarai', 'aztecas');--> statement-breakpoint
CREATE TYPE "public"."ambassador_status" AS ENUM('active', 'pending', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('pending', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."commission_type" AS ENUM('DIRECT_SALE_4', 'RESIDUAL_YIELD_1');--> statement-breakpoint
CREATE TABLE "ambassador_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambassador_id" uuid NOT NULL,
	"client_wallet" varchar(42) NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ambassador_clients_client_wallet_unique" UNIQUE("client_wallet")
);
--> statement-breakpoint
CREATE TABLE "ambassador_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambassador_id" uuid NOT NULL,
	"client_wallet" varchar(42) NOT NULL,
	"amount_usdc" numeric(18, 6) NOT NULL,
	"type" "commission_type" NOT NULL,
	"status" "commission_status" DEFAULT 'pending' NOT NULL,
	"source_tx_hash" varchar(66),
	"source_reference" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ambassadors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer,
	"referral_code" varchar(255) NOT NULL,
	"wallet_address" varchar(42),
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"social_url" varchar(255),
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(6),
	"origin" "ambassador_origin" DEFAULT 'pandoras' NOT NULL,
	"status" "ambassador_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ambassadors_referral_code_unique" UNIQUE("referral_code"),
	CONSTRAINT "ambassadors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ambassador_clients" ADD CONSTRAINT "ambassador_clients_ambassador_id_ambassadors_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambassador_commissions" ADD CONSTRAINT "ambassador_commissions_ambassador_id_ambassadors_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ambassador_clients_amb_idx" ON "ambassador_clients" USING btree ("ambassador_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ambassador_commissions_txhash_idx" ON "ambassador_commissions" USING btree ("source_tx_hash");--> statement-breakpoint
CREATE INDEX "ambassador_commissions_amb_idx" ON "ambassador_commissions" USING btree ("ambassador_id");--> statement-breakpoint
CREATE INDEX "ambassador_commissions_status_idx" ON "ambassador_commissions" USING btree ("status");