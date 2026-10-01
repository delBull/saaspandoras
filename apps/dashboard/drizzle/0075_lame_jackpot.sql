CREATE TYPE "public"."nft_collection_status" AS ENUM('DRAFT', 'GOVERNANCE_PENDING', 'DEPLOYED', 'PAUSED', 'RETIRED');--> statement-breakpoint
CREATE TYPE "public"."nft_issuance_status" AS ENUM('pending_mint', 'minted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."nft_purpose" AS ENUM('ACCESS', 'IDENTITY', 'MEMBERSHIP', 'REWARD', 'REPUTATION', 'COLLECTIBLE', 'EXPERIENCE', 'GOVERNANCE');--> statement-breakpoint
CREATE TYPE "public"."nft_standard" AS ENUM('ERC-721', 'ERC-1155', 'SBT');--> statement-breakpoint
CREATE TABLE "tenant_nft_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"description" text,
	"purpose" "nft_purpose" NOT NULL,
	"standard" "nft_standard" DEFAULT 'ERC-721' NOT NULL,
	"transferable" boolean DEFAULT true NOT NULL,
	"burnable" boolean DEFAULT false NOT NULL,
	"expirable" boolean DEFAULT false NOT NULL,
	"revokable" boolean DEFAULT false NOT NULL,
	"total_supply" integer DEFAULT 0 NOT NULL,
	"reserved_supply" integer DEFAULT 0,
	"royalty_fee_bps" integer DEFAULT 250,
	"chain_id" integer DEFAULT 8453 NOT NULL,
	"contract_address" varchar(42),
	"deploy_tx_hash" varchar(66),
	"deployed_at" timestamp with time zone,
	"image_ipfs_cid" varchar(255),
	"metadata_ipfs_cid" varchar(255),
	"config" jsonb DEFAULT '{}'::jsonb,
	"status" "nft_collection_status" DEFAULT 'DRAFT' NOT NULL,
	"governance_intent_id" varchar(255),
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_nft_issuances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"project_id" integer NOT NULL,
	"recipient_wallet" varchar(42) NOT NULL,
	"recipient_lead_id" uuid,
	"token_id" varchar(255),
	"mint_tx_hash" varchar(66),
	"minted_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_by" varchar(255),
	"governance_intent_id" varchar(255),
	"status" "nft_issuance_status" DEFAULT 'pending_mint' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_nft_collections" ADD CONSTRAINT "tenant_nft_collections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_nft_issuances" ADD CONSTRAINT "tenant_nft_issuances_collection_id_tenant_nft_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."tenant_nft_collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_nft_issuances" ADD CONSTRAINT "tenant_nft_issuances_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_nft_issuances" ADD CONSTRAINT "tenant_nft_issuances_recipient_lead_id_marketing_leads_id_fk" FOREIGN KEY ("recipient_lead_id") REFERENCES "public"."marketing_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_nft_collections_org_idx" ON "tenant_nft_collections" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tenant_nft_collections_status_idx" ON "tenant_nft_collections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tenant_nft_collections_project_status_idx" ON "tenant_nft_collections" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "tenant_nft_issuances_collection_idx" ON "tenant_nft_issuances" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "tenant_nft_issuances_recipient_idx" ON "tenant_nft_issuances" USING btree ("recipient_wallet");--> statement-breakpoint
CREATE INDEX "tenant_nft_issuances_project_status_idx" ON "tenant_nft_issuances" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "tenant_nft_issuances_lead_idx" ON "tenant_nft_issuances" USING btree ("recipient_lead_id");