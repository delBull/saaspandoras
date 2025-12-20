
-- ENUMS
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

-- TABLE: clients
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    name VARCHAR(255),
    wallet_address VARCHAR(42),
    source VARCHAR(50) DEFAULT 'manual',
    package VARCHAR(50),
    status client_status DEFAULT 'lead' NOT NULL,
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLE: payment_links
CREATE TABLE IF NOT EXISTS payment_links (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    methods JSONB DEFAULT '["stripe", "crypto", "wire"]'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    expires_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLE: transactions
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id TEXT REFERENCES payment_links(id) ON DELETE SET NULL,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    method payment_method NOT NULL,
    status transaction_status DEFAULT 'pending' NOT NULL,
    external_id TEXT,
    proof_url TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
