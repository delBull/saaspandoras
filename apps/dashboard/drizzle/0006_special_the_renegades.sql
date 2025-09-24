CREATE TABLE "User" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"image" text,
	"walletAddress" varchar(42),
	"hasPandorasKey" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_walletAddress_unique" UNIQUE("walletAddress")
);
