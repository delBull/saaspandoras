CREATE TYPE "public"."audit_actor" AS ENUM('Founder', 'Worker', 'Cron', 'API', 'Railway', 'Admin');--> statement-breakpoint
CREATE TYPE "public"."blockchain_environment" AS ENUM('BASE_MAINNET', 'BASE_SEPOLIA', 'ETHEREUM', 'POLYGON', 'LOCAL');--> statement-breakpoint
CREATE TYPE "public"."protocol_capability" AS ENUM('IDENTITY', 'MEMBERSHIP', 'MARKETPLACE', 'MORTGAGE', 'LENDING', 'DAO', 'BRIDGE', 'RENTAL', 'GOVERNANCE', 'VOTING', 'TREASURY', 'REFERRAL', 'ANALYTICS', 'AI');--> statement-breakpoint
CREATE TYPE "public"."protocol_lifecycle" AS ENUM('QUEUED', 'VALIDATING', 'FAILED_VALIDATE', 'VALIDATED', 'PREPARING', 'DEPLOYING_INFRASTRUCTURE', 'FAILED_INFRASTRUCTURE', 'INFRASTRUCTURE_DEPLOYED', 'MINTING_TOKENS', 'FAILED_MINT', 'MINT_COMPLETED', 'TRANSFERRING_OWNERSHIP', 'FAILED_OWNERSHIP', 'FINALIZED', 'UNRECOVERABLE');--> statement-breakpoint
CREATE TABLE "protocol_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"runtime_id" integer NOT NULL,
	"role" varchar(100) NOT NULL,
	"address" varchar(256),
	"transaction_hash" varchar(256),
	"deployed_at" timestamp with time zone,
	"artifact_type" varchar(100),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "protocol_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"runtime_id" integer NOT NULL,
	"action" varchar(100) NOT NULL,
	"actor" "audit_actor" NOT NULL,
	"actor_id" varchar(256),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_capabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"runtime_id" integer NOT NULL,
	"capability" "protocol_capability" NOT NULL,
	"enabled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "protocol_checkpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"runtime_id" integer NOT NULL,
	"checkpoint" varchar(100) NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "protocol_runtime_locks" (
	"id" serial PRIMARY KEY NOT NULL,
	"runtime_id" integer NOT NULL,
	"worker_id" varchar(256) NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone,
	CONSTRAINT "protocol_runtime_locks_runtime_id_unique" UNIQUE("runtime_id")
);
--> statement-breakpoint
CREATE TABLE "protocol_runtimes" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"lifecycle" "protocol_lifecycle" DEFAULT 'QUEUED' NOT NULL,
	"protocol_version" integer DEFAULT 1 NOT NULL,
	"runtime_version" varchar(50),
	"engine_version" varchar(50),
	"environment" "blockchain_environment" NOT NULL,
	"salt" varchar(128),
	"factory_address" varchar(256),
	"creator_wallet" varchar(128),
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_timeline_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"runtime_id" integer NOT NULL,
	"from_state" "protocol_lifecycle",
	"to_state" "protocol_lifecycle" NOT NULL,
	"action" varchar(100) NOT NULL,
	"duration_ms" integer,
	"gas_used" varchar(100),
	"effective_gas_price" varchar(100),
	"block_number" integer,
	"confirmations" integer,
	"tx_hash" varchar(256),
	"rpc_latency_ms" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"semantic_version" varchar(50) NOT NULL,
	"migration" text,
	"compatibility" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "protocol_versions_semantic_version_unique" UNIQUE("semantic_version")
);
--> statement-breakpoint
ALTER TABLE "protocol_artifacts" ADD CONSTRAINT "protocol_artifacts_runtime_id_protocol_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."protocol_runtimes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_audit_logs" ADD CONSTRAINT "protocol_audit_logs_runtime_id_protocol_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."protocol_runtimes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_capabilities" ADD CONSTRAINT "protocol_capabilities_runtime_id_protocol_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."protocol_runtimes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_checkpoints" ADD CONSTRAINT "protocol_checkpoints_runtime_id_protocol_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."protocol_runtimes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_runtime_locks" ADD CONSTRAINT "protocol_runtime_locks_runtime_id_protocol_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."protocol_runtimes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_runtimes" ADD CONSTRAINT "protocol_runtimes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_timeline_events" ADD CONSTRAINT "protocol_timeline_events_runtime_id_protocol_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."protocol_runtimes"("id") ON DELETE no action ON UPDATE no action;