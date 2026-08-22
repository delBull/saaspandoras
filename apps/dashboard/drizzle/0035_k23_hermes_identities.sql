-- Migration 0035: Hermes OS Milestone 6.0 — K23 Hermes Cryptographic Identity Layer

CREATE TABLE IF NOT EXISTS "hermes_identities" (
  "id" varchar(100) PRIMARY KEY NOT NULL,
  "public_address" varchar(42) NOT NULL UNIQUE,
  "tenant_id" varchar(100) NOT NULL,
  "instance_id" varchar(100) NOT NULL,
  "capabilities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "policy_hash" varchar(64) NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'REVOKED' | 'ROTATED'
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);

-- Enable RLS on hermes_identities
ALTER TABLE hermes_identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hermes_identities_tenant_policy ON hermes_identities;
CREATE POLICY hermes_identities_tenant_policy ON hermes_identities
  FOR ALL
  USING (
    CURRENT_USER = 'neondb_owner'
    OR tenant_id = current_setting('hermes.current_tenant', true)
    OR tenant_id = 'pandoras_global'
  )
  WITH CHECK (
    CURRENT_USER = 'neondb_owner'
    OR tenant_id = current_setting('hermes.current_tenant', true)
  );

-- Grant select to hermes_runtime_worker
GRANT SELECT ON hermes_identities TO hermes_runtime_worker;
