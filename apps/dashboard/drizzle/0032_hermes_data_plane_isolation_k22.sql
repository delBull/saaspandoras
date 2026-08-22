-- Migration 0032: Hermes OS Milestone 5.0 — K22 Data Plane Isolation
-- Creates session context function and establishes tenant isolation patterns.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Secure Tenant Session Initializer Function
CREATE OR REPLACE FUNCTION set_hermes_tenant_session(
  p_tenant_id TEXT,
  p_actor_id TEXT,
  p_expires_at BIGINT,
  p_nonce TEXT,
  p_signature TEXT,
  p_secret TEXT DEFAULT 'pandoras_hermes_db_session_internal_secret_32bytes!'
) RETURNS BOOLEAN AS $$
DECLARE
  v_message TEXT;
  v_expected_sig TEXT;
BEGIN
  -- A. Expiration Check
  IF p_expires_at < EXTRACT(EPOCH FROM NOW())::BIGINT THEN
    RAISE EXCEPTION 'Hermes tenant session token expired';
  END IF;

  -- B. HMAC Signature Verification
  v_message := p_tenant_id || ':' || p_actor_id || ':' || p_expires_at::TEXT || ':' || p_nonce;
  v_expected_sig := encode(hmac(v_message::bytea, p_secret::bytea, 'sha256'), 'hex');

  IF p_signature != v_expected_sig THEN
    RAISE EXCEPTION 'Invalid tenant session signature. Potential spoofing attempt.';
  END IF;

  -- C. Set Local Transaction Context Variables
  PERFORM set_config('hermes.current_tenant', p_tenant_id, true);
  PERFORM set_config('hermes.current_actor', p_actor_id, true);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
