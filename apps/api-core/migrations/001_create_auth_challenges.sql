-- Create auth_challenges table for SIWE authentication
-- This table stores nonces for Sign-In with Ethereum flow

CREATE TABLE IF NOT EXISTS auth_challenges (
    id SERIAL PRIMARY KEY,
    nonce TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster nonce lookups
CREATE INDEX IF NOT EXISTS idx_auth_challenges_nonce ON auth_challenges(nonce);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_address ON auth_challenges(address);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires_at ON auth_challenges(expires_at);

-- Clean up expired challenges automatically (optional, requires pg_cron extension)
-- DELETE FROM auth_challenges WHERE expires_at < NOW();
