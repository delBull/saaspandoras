CREATE TABLE IF NOT EXISTS "nexus_direct_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_org_id" varchar(256) DEFAULT 'pandoras' NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"sender_name" varchar(128) DEFAULT 'Operador' NOT NULL,
	"receiver_email" varchar(255) NOT NULL,
	"receiver_name" varchar(128),
	"content" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_nexus_dm_org" ON "nexus_direct_messages" USING btree ("canonical_org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_nexus_dm_sender" ON "nexus_direct_messages" USING btree ("sender_email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_nexus_dm_receiver" ON "nexus_direct_messages" USING btree ("receiver_email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_nexus_dm_created" ON "nexus_direct_messages" USING btree ("created_at");
