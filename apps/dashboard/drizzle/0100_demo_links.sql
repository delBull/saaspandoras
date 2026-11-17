-- 0100: enlaces de demostración en SOLO LECTURA.
--
-- Un enlace = un token opaco (se guarda su hash, nunca el token en claro) ligado a
-- una organización. Sirve para mostrar el producto sin crear identidades ni tocar
-- permisos, y se revoca borrando o marcando revoked_at.
--
-- Aditivo y aislado: no modifica ninguna tabla existente.

CREATE TABLE IF NOT EXISTS "demo_links" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "organization_id" varchar(256) NOT NULL,
  "label" varchar(128) NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "view_count" integer NOT NULL DEFAULT 0,
  "last_viewed_at" timestamp with time zone,
  "created_by" varchar(128) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "demo_links_label_chk" CHECK (length("label") > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "demo_links_token_hash_unique"
  ON "demo_links" ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "demo_links_org_idx"
  ON "demo_links" ("organization_id");
