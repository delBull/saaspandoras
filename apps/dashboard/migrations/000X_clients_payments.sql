-- Migration: Clients, Payment Links, and Transactions System

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE client_status AS ENUM ('lead', 'negotiating', 'closed_won', 'closed_lost', 'churned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('stripe', 'crypto', 'wire');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    name VARCHAR(255),
    wallet_address VARCHAR(42),
    source VARCHAR(50) DEFAULT 'manual',
    package VARCHAR(50),
    status client_status NOT NULL DEFAULT 'lead',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Payment Links Table
CREATE TABLE IF NOT EXISTS payment_links (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL REFERENCES clients(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    methods JSONB DEFAULT '["stripe", "crypto", "wire"]' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id TEXT REFERENCES payment_links(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    method payment_method NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    external_id TEXT,
    proof_url TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
