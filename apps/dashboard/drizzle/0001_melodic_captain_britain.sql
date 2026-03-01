ALTER TYPE "public"."achievement_type" ADD VALUE 'projects';--> statement-breakpoint
ALTER TYPE "public"."achievement_type" ADD VALUE 'investments';--> statement-breakpoint
ALTER TYPE "public"."achievement_type" ADD VALUE 'community';--> statement-breakpoint
ALTER TYPE "public"."achievement_type" ADD VALUE 'learning';--> statement-breakpoint
ALTER TYPE "public"."achievement_type" ADD VALUE 'streaks';--> statement-breakpoint
ALTER TYPE "public"."achievement_type" ADD VALUE 'special';--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"project_id" integer NOT NULL,
	"amount" numeric(18, 6) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"purchase_id" varchar(255) NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"thirdweb_session_id" varchar(255),
	"stripe_session_id" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_purchase_id_unique" UNIQUE("purchase_id"),
	CONSTRAINT "purchases_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;