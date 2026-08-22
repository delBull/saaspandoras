-- Migration 0033: Hermes OS Milestone 5.0 — K22 Real RLS, Roles and HMAC Key Vault

-- 1. Create Internal Control Plane Secrets Store (Protected from public/worker)
CREATE TABLE IF NOT EXISTS "hermes_internal_keys" (
  "key_name" varchar(100) PRIMARY KEY NOT NULL,
  "key_value" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Revoke all access on secrets table from public
REVOKE ALL ON "hermes_internal_keys" FROM PUBLIC;

-- Insert or update runtime session HMAC secret (random 32-byte hex if not exists)
INSERT INTO "hermes_internal_keys" ("key_name", "key_value", "updated_at")
VALUES ('db_session_hmac_secret', encode(gen_random_bytes(32), 'hex'), NOW())
ON CONFLICT ("key_name") DO NOTHING;

-- 2. Redefine set_hermes_tenant_session to read secret from internal table (Zero hardcoded defaults in signature)
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

  -- B. Fetch secret securely from protected table
  SELECT key_value INTO v_secret 
  FROM hermes_internal_keys 
  WHERE key_name = 'db_session_hmac_secret';

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'Internal session HMAC secret uninitialized';
  END IF;

  -- C. HMAC Signature Verification
  v_message := p_tenant_id || ':' || p_actor_id || ':' || p_expires_at::TEXT || ':' || p_nonce;
  v_expected_sig := encode(hmac(v_message::bytea, v_secret::bytea, 'sha256'), 'hex');

  IF p_signature != v_expected_sig THEN
    RAISE EXCEPTION 'Invalid tenant session signature. Potential spoofing attempt.';
  END IF;

  -- D. Set Local Transaction Context Variables
  PERFORM set_config('hermes.current_tenant', p_tenant_id, true);
  PERFORM set_config('hermes.current_actor', p_actor_id, true);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Role hermes_runtime_worker (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hermes_runtime_worker') THEN
    CREATE ROLE hermes_runtime_worker WITH
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      PASSWORD 'hermes_ephemeral_worker_neon_pwd_2026';
  END IF;
END $$;

-- 4. Revoke All on public schema from hermes_runtime_worker
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM hermes_runtime_worker;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM hermes_runtime_worker;

-- 5. Grant execute on the secure session setter function
GRANT EXECUTE ON FUNCTION set_hermes_tenant_session(TEXT, TEXT, BIGINT, TEXT, TEXT) TO hermes_runtime_worker;

-- 6. Grant Least-Privilege Data Plane Access
GRANT SELECT ON hermes_knowledge TO hermes_runtime_worker;
GRANT SELECT, INSERT, UPDATE ON hermes_conversations TO hermes_runtime_worker;
GRANT SELECT, INSERT ON hermes_conversation_messages TO hermes_runtime_worker;
GRANT SELECT, INSERT, UPDATE ON hermes_actor_journeys TO hermes_runtime_worker;
GRANT SELECT ON hermes_journeys TO hermes_runtime_worker;
GRANT SELECT ON hermes_journey_stages TO hermes_runtime_worker;
GRANT SELECT ON hermes_journey_transitions TO hermes_runtime_worker;
GRANT INSERT ON hermes_security_events TO hermes_runtime_worker;
GRANT SELECT (id, slug, title, organization_id, status, chain_id, contract_address) ON projects TO hermes_runtime_worker;
GRANT SELECT (id, project_id, wallet, voting_power, artifacts_count) ON dao_members TO hermes_runtime_worker;

-- 7. Explicit REVOKE on forbidden control plane and sensitive tables
REVOKE ALL ON users FROM hermes_runtime_worker;
REVOKE ALL ON user_identities FROM hermes_runtime_worker;
REVOKE ALL ON sessions FROM hermes_runtime_worker;
REVOKE ALL ON administrators FROM hermes_runtime_worker;
REVOKE ALL ON access_requests FROM hermes_runtime_worker;
REVOKE ALL ON purchases FROM hermes_runtime_worker;
REVOKE ALL ON user_balances FROM hermes_runtime_worker;
REVOKE ALL ON integration_clients FROM hermes_runtime_worker;
REVOKE ALL ON hermes_internal_keys FROM hermes_runtime_worker;

-- 8. Enable Row-Level Security (RLS) on all Hermes core tables
ALTER TABLE hermes_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE hermes_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hermes_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hermes_actor_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE hermes_security_events ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies (Enforce tenant isolation on cognitive data plane)
DROP POLICY IF EXISTS hermes_knowledge_tenant_policy ON hermes_knowledge;
CREATE POLICY hermes_knowledge_tenant_policy ON hermes_knowledge
  FOR ALL
  USING (
    CURRENT_USER = 'neondb_owner'
    OR organization_id = current_setting('hermes.current_tenant', true)
    OR organization_id = 'pandoras_global'
    OR organization_id = 'snarai'
  );

DROP POLICY IF EXISTS hermes_conversations_tenant_policy ON hermes_conversations;
CREATE POLICY hermes_conversations_tenant_policy ON hermes_conversations
  FOR ALL
  USING (
    CURRENT_USER = 'neondb_owner'
    OR organization_id = current_setting('hermes.current_tenant', true)
  )
  WITH CHECK (
    CURRENT_USER = 'neondb_owner'
    OR organization_id = current_setting('hermes.current_tenant', true)
  );

DROP POLICY IF EXISTS hermes_conversation_messages_tenant_policy ON hermes_conversation_messages;
CREATE POLICY hermes_conversation_messages_tenant_policy ON hermes_conversation_messages
  FOR ALL
  USING (
    CURRENT_USER = 'neondb_owner'
    OR conversation_id IN (
      SELECT id FROM hermes_conversations WHERE organization_id = current_setting('hermes.current_tenant', true)
    )
  );

DROP POLICY IF EXISTS hermes_actor_journeys_tenant_policy ON hermes_actor_journeys;
CREATE POLICY hermes_actor_journeys_tenant_policy ON hermes_actor_journeys
  FOR ALL
  USING (
    CURRENT_USER = 'neondb_owner'
    OR organization_id = current_setting('hermes.current_tenant', true)
  );

DROP POLICY IF EXISTS hermes_security_events_tenant_policy ON hermes_security_events;
CREATE POLICY hermes_security_events_tenant_policy ON hermes_security_events
  FOR ALL
  USING (
    CURRENT_USER = 'neondb_owner'
    OR organization_id = current_setting('hermes.current_tenant', true)
  )
  WITH CHECK (
    CURRENT_USER = 'neondb_owner'
    OR organization_id = current_setting('hermes.current_tenant', true)
  );
