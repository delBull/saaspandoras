-- 🏛️ Pandora's Hermes OS — Milestone 8.0: K25 Sovereign Knowledge Registry & Vault Governance
-- Migration: 0036_k25_hermes_knowledge_registry.sql

CREATE TABLE IF NOT EXISTS hermes_knowledge_registry (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL,               -- 'corporate_constitution', 'legal_holding', 'academy', 'patrimonial'
    artifact_id VARCHAR(255) NOT NULL,
    classification VARCHAR(50) NOT NULL,        -- 'PUBLIC', 'TENANT_RESTRICTED', 'B2B_RESTRICTED', 'INTERNAL_OPERATIONAL', 'CONFIDENTIAL', 'SECRET'
    version INTEGER NOT NULL DEFAULT 1,
    content_hash VARCHAR(64) NOT NULL,          -- SHA-256 of plaintext
    ciphertext_hash VARCHAR(64),                -- SHA-256 of encrypted payload (NULL if PUBLIC)
    ipfs_cid VARCHAR(255) NOT NULL,             -- CIDv1 (e.g. bafkrei...)
    ipfs_uri VARCHAR(512) NOT NULL,             -- ipfs://bafkrei...
    aad_binding TEXT,                           -- Serialized AAD string used in AES-GCM
    merkle_root VARCHAR(64),                    -- Root of the domain manifest
    signed_by_address VARCHAR(42) NOT NULL,     -- Agent Wallet Address (0x...)
    agent_signature TEXT NOT NULL,              -- EIP-712 Signature of action intent
    governance_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'STAGED', 'SHADOW_VERIFIED', 'ACTIVE', 'PURGED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row-Level Security (RLS)
ALTER TABLE hermes_knowledge_registry ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation RLS Policy
DROP POLICY IF EXISTS hermes_knowledge_registry_tenant_policy ON hermes_knowledge_registry;
CREATE POLICY hermes_knowledge_registry_tenant_policy ON hermes_knowledge_registry
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('hermes.current_tenant', true), '')
        OR current_user = 'neondb_owner'
    );

-- Indexes for high-performance scoped lookups
CREATE INDEX IF NOT EXISTS hermes_kr_tenant_domain_idx ON hermes_knowledge_registry (tenant_id, domain, governance_status);
CREATE INDEX IF NOT EXISTS hermes_kr_artifact_version_idx ON hermes_knowledge_registry (tenant_id, artifact_id, version);
CREATE INDEX IF NOT EXISTS hermes_kr_cid_idx ON hermes_knowledge_registry (ipfs_cid);

-- Grants to worker role
GRANT SELECT, INSERT, UPDATE ON hermes_knowledge_registry TO hermes_runtime_worker;
