-- 0116 · Contactos de un Deal Pod (canal WhatsApp)
-- Aislados por pod y organización. NO son identidades de marketing ni de tenant:
-- son la ficha de la persona dentro de su pod, para que Hermes la reconozca en
-- el canal maestro sin mezclarla con los demás casos.

CREATE TABLE IF NOT EXISTS "nexus_pod_contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pod_id" uuid NOT NULL REFERENCES "nexus_deal_pods"("id") ON DELETE CASCADE,
  "canonical_org_id" varchar(256) NOT NULL DEFAULT 'pandoras',
  "phone" varchar(50),
  "email" varchar(255),
  "name" varchar(255) NOT NULL,
  "role" varchar(32) NOT NULL DEFAULT 'CLIENT',
  "relationship" varchar(160),
  "context" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "welcome_enabled" boolean NOT NULL DEFAULT false,
  "welcome_cooldown_hours" integer NOT NULL DEFAULT 168,
  "last_welcomed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_pod_contacts_pod_phone"
  ON "nexus_pod_contacts" ("pod_id", "phone");
CREATE INDEX IF NOT EXISTS "idx_pod_contacts_phone"
  ON "nexus_pod_contacts" ("phone");
CREATE INDEX IF NOT EXISTS "idx_pod_contacts_org"
  ON "nexus_pod_contacts" ("canonical_org_id");
