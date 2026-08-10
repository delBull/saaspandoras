CREATE TYPE "public"."nexus_deal_kind" AS ENUM('PROPOSAL', 'AGREEMENT', 'CONTRACT', 'AMENDMENT');--> statement-breakpoint
CREATE TYPE "public"."nexus_deal_status" AS ENUM('DRAFT', 'PROPOSAL_SENT', 'REVIEW', 'ACCEPTED', 'SIGNED', 'EXECUTED');--> statement-breakpoint
CREATE TYPE "public"."nexus_signer_status" AS ENUM('PENDING', 'MAGIC_SENT', 'VIEWED', 'SIGNED');--> statement-breakpoint
CREATE TABLE "nexus_deal_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" text DEFAULT 'Nexus Ops' NOT NULL,
	"action" text NOT NULL,
	"detail" text
);
--> statement-breakpoint
CREATE TABLE "nexus_deal_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(64) NOT NULL,
	"kind" "nexus_deal_kind" DEFAULT 'PROPOSAL' NOT NULL,
	"counterparty" text NOT NULL,
	"relation" text DEFAULT 'Strategic Partner' NOT NULL,
	"company" text DEFAULT 'Pandoras USA Operations LLC' NOT NULL,
	"status" "nexus_deal_status" DEFAULT 'DRAFT' NOT NULL,
	"summary" text,
	"auto_share" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nexus_deal_rooms_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "nexus_deal_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"code" varchar(4) NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_deal_signers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"email" text NOT NULL,
	"status" "nexus_signer_status" DEFAULT 'PENDING' NOT NULL,
	"token_expires_at" timestamp with time zone,
	"signed_at" timestamp with time zone,
	"signature_name" text,
	"wallet" text
);
--> statement-breakpoint
ALTER TABLE "nexus_deal_audit_events" ADD CONSTRAINT "nexus_deal_audit_events_room_id_nexus_deal_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."nexus_deal_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_deal_sections" ADD CONSTRAINT "nexus_deal_sections_room_id_nexus_deal_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."nexus_deal_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_deal_signers" ADD CONSTRAINT "nexus_deal_signers_room_id_nexus_deal_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."nexus_deal_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nexus_signers_room_email_idx" ON "nexus_deal_signers" USING btree ("room_id","email");