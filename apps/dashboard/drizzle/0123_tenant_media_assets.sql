-- 0123 · Biblioteca de medios por tenant (ADR-020 §2.3-bis)
--
-- Instagram exige una URL https pública para publicar: la imagen no viaja en el
-- request. Esta tabla es la fuente de esas URLs: cada asset subido (o generado
-- por Hermes) queda con su URL pública y sus metadatos, por organización.

CREATE TABLE IF NOT EXISTS tenant_media_assets (
  id               varchar(64)  PRIMARY KEY,
  canonical_org_id varchar(255) NOT NULL,
  kind             varchar(32)  NOT NULL DEFAULT 'image',   -- image | video | document
  title            varchar(255) NOT NULL,
  url              varchar(1000) NOT NULL,
  mime_type        varchar(100),
  size_bytes       integer,
  width            integer,
  height           integer,
  source           varchar(32)  NOT NULL DEFAULT 'manual',  -- manual | generated
  meta             jsonb,
  created_by       varchar(255),
  created_at       timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_media_assets_org_idx
  ON tenant_media_assets (canonical_org_id, created_at DESC);
