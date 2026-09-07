CREATE TABLE "hermes_cognitive_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"transactional_score" integer DEFAULT 0 NOT NULL,
	"educational_score" integer DEFAULT 0 NOT NULL,
	"persona" varchar(50) DEFAULT 'UNKNOWN' NOT NULL,
	"last_interaction_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hermes_cognitive_profiles_user_id_unique" UNIQUE("user_id")
);
