CREATE TABLE IF NOT EXISTS "platform_settings" (
    "id" serial PRIMARY KEY,
    "key" varchar(255) NOT NULL UNIQUE,
    "value" text,
    "description" text,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_by" varchar(42)
);
