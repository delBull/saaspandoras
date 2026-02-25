CREATE TABLE "administrators" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"added_by" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "administrators_wallet_address_unique" UNIQUE("wallet_address")
);
