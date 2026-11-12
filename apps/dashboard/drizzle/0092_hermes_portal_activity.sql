-- 0092: actividad del Portal por tenant ("quién está dentro").
CREATE TABLE IF NOT EXISTS "hermes_portal_activity" (
  "tenant_id" varchar(128) PRIMARY KEY,
  "last_seen_at" timestamp with time zone NOT NULL DEFAULT now(),
  "first_seen_at" timestamp with time zone NOT NULL DEFAULT now(),
  "last_actor_id" varchar(160),
  "hits" integer NOT NULL DEFAULT 0,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "hermes_portal_activity_last_seen_idx"
  ON "hermes_portal_activity" ("last_seen_at");
