CREATE TABLE "dao_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"amount" numeric(18, 6) NOT NULL,
	"token" varchar(20) DEFAULT 'USDC' NOT NULL,
	"reason" text NOT NULL,
	"claim_batch_id" integer,
	"claimed_at" timestamp,
	"tx_hash" varchar(66),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distribution_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"total_amount" numeric(18, 6) NOT NULL,
	"total_holders" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USDC' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"tx_hash" varchar(66),
	"executed_by" varchar(42) NOT NULL,
	"batch_metadata" jsonb DEFAULT '{}',
	"failure_reason" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" varchar(255) NOT NULL,
	"voter_address" varchar(42) NOT NULL,
	"support" integer NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"amount" numeric(18, 6) NOT NULL,
	"token" varchar(20) DEFAULT 'USDC' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"tx_hash" varchar(66),
	"nonce" integer NOT NULL,
	"signature" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "marketing_lead_attributions" ALTER COLUMN "lead_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "allowance_controller_address" varchar(42);--> statement-breakpoint
ALTER TABLE "user_balances" ADD COLUMN "nonce" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_proposal_voter" ON "intent_votes" USING btree ("proposal_id","voter_address");--> statement-breakpoint
CREATE INDEX "intent_votes_proposal_idx" ON "intent_votes" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "intent_votes_voter_idx" ON "intent_votes" USING btree ("voter_address");--> statement-breakpoint
ALTER TABLE "campaign_stats" DROP COLUMN "last_updated";