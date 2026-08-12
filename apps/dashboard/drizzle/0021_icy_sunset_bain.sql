CREATE TABLE "channel_identity_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"channel" varchar(50) NOT NULL,
	"external_user_id" varchar(255) NOT NULL,
	"address" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "channel_external_user_unique" ON "channel_identity_bindings" USING btree ("channel","external_user_id");--> statement-breakpoint
CREATE INDEX "cib_identity_idx" ON "channel_identity_bindings" USING btree ("identity_id");