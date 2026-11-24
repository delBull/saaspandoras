-- 0117 · Identidad por tenant + seguro del vault
--
-- 1) tenant_signing_keys: cada tenant firma con su propia llave (antes todas las
--    filas del registro firmaban con la misma HERMES_IDENTITY_PRIVATE_KEY).
--    La privada se guarda cifrada con la KEK; nunca en claro.
-- 2) knowledge_vault_blobs: sobre cifrado de cada artefacto del vault, para poder
--    re-fijarlo con los mismos bytes (mismo CID) si el nodo IPFS pierde el bloque.

CREATE TABLE IF NOT EXISTS tenant_signing_keys (
  id                    varchar(255) PRIMARY KEY,
  tenant_id             varchar(255) NOT NULL UNIQUE,
  address               varchar(42)  NOT NULL,
  encrypted_private_key text         NOT NULL,
  key_version           integer      NOT NULL DEFAULT 1,
  status                varchar(24)  NOT NULL DEFAULT 'ACTIVE',
  created_by            varchar(255),
  created_at            timestamp with time zone NOT NULL DEFAULT now(),
  rotated_at            timestamp with time zone
);

CREATE TABLE IF NOT EXISTS knowledge_vault_blobs (
  id              varchar(255) PRIMARY KEY,
  tenant_id       varchar(255) NOT NULL,
  artifact_id     varchar(255) NOT NULL,
  version         integer      NOT NULL DEFAULT 1,
  cid             varchar(255) NOT NULL,
  content_hash    varchar(64)  NOT NULL,
  ciphertext_hash varchar(64)  NOT NULL,
  envelope_json   text         NOT NULL,
  updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_vault_blobs_tenant_artifact_uq
  ON knowledge_vault_blobs (tenant_id, artifact_id);

CREATE INDEX IF NOT EXISTS knowledge_vault_blobs_cid_idx
  ON knowledge_vault_blobs (cid);
