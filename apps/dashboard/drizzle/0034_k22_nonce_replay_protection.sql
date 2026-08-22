-- Migration 0034: K22.1 Nonce Tracking for Anti-Replay Protection & Transaction-Local Scoping

CREATE TABLE IF NOT EXISTS "hermes_used_nonces" (
  "nonce" varchar(64) PRIMARY KEY NOT NULL,
  "tenant_id" varchar(100) NOT NULL,
  "expires_at" bigint NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Revoke all on nonces from public/worker (worker executes via SECURITY DEFINER function only)
REVOKE ALL ON "hermes_used_nonces" FROM PUBLIC;

-- Update set_hermes_tenant_session with strict nonce anti-replay check
CREATE OR REPLACE FUNCTION set_hermes_tenant_session(
  p_tenant_id TEXT,
  p_actor_id TEXT,
  p_expires_at BIGINT,
  p_nonce TEXT,
  p_signature TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_secret TEXT;
  v_message TEXT;
  v_expected_sig TEXT;
BEGIN
  -- A. Expiration Check
  IF p_expires_at < EXTRACT(EPOCH FROM NOW())::BIGINT THEN
    RAISE EXCEPTION 'Hermes tenant session token expired';
  END IF;

  -- B. Nonce Anti-Replay Check
  IF EXISTS (SELECT 1 FROM hermes_used_nonces WHERE nonce = p_nonce) THEN
    RAISE EXCEPTION 'Hermes session token nonce already consumed. Replay attack detected.';
  END IF;

  -- C. Fetch secret securely from protected table
  SELECT key_value INTO v_secret 
  FROM hermes_internal_keys 
  WHERE key_name = 'db_session_hmac_secret';

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'Internal session HMAC secret uninitialized';
  END IF;

  -- D. HMAC Signature Verification
  v_message := p_tenant_id || ':' || p_actor_id || ':' || p_expires_at::TEXT || ':' || p_nonce;
  v_expected_sig := encode(hmac(v_message::bytea, v_secret::bytea, 'sha256'), 'hex');

  IF p_signature != v_expected_sig THEN
    RAISE EXCEPTION 'Invalid tenant session signature. Potential spoofing attempt.';
  END IF;

  -- E. Record Nonce Consumption
  INSERT INTO hermes_used_nonces (nonce, tenant_id, expires_at)
  VALUES (p_nonce, p_tenant_id, p_expires_at);

  -- F. Set Transaction-Local Context Variables (is_local = TRUE)
  PERFORM set_config('hermes.current_tenant', p_tenant_id, true);
  PERFORM set_config('hermes.current_actor', p_actor_id, true);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
