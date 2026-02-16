-- Multi-Tenant Support Tables
-- Phase 5: Identity & Gating Architecture

-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{"nftContracts":[],"minTokenBalance":"0","requiredRoles":[],"whitelistedAddresses":[]}',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS tenants_name_idx ON tenants(name);
CREATE INDEX IF NOT EXISTS tenants_active_idx ON tenants(is_active);

-- ============================================
-- TENANT USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(100) NOT NULL,
    roles JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS tenant_users_tenant_idx ON tenant_users(tenant_id);

-- ============================================
-- NFT OWNERSHIP CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nft_ownership_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL,
    holder VARCHAR(42) NOT NULL,
    balance VARCHAR(78) NOT NULL,
    last_checked TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(contract_address, chain_id, holder)
);

CREATE INDEX IF NOT EXISTS nft_cache_expires_idx ON nft_ownership_cache(expires_at);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    address VARCHAR(42),
    tenant_id VARCHAR(100),
    ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_code VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_logs_address_idx ON audit_logs(address);
CREATE INDEX IF NOT EXISTS audit_logs_tenant_idx ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS audit_logs_event_idx ON audit_logs(event);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at);

-- ============================================
-- INSERT DEFAULT TENANT
-- ============================================
INSERT INTO tenants (id, name, description, config, is_active)
VALUES (
    'pandoras-main',
    'Pandoras Main',
    'The main Pandoras platform',
    '{
        "nftContracts": [{
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 11155111,
            "minBalance": 1
        }],
        "minTokenBalance": "0",
        "requiredRoles": [],
        "whitelistedAddresses": []
    }',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CLEANUP OLD CACHE ENTRIES (run periodically)
-- ============================================
-- DELETE FROM nft_ownership_cache WHERE expires_at < NOW();
