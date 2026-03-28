-- 🧬 Phase 89: Fix Structural Session ID Mismatch
-- Goal: Convert sessions.id from INTEGER to UUID to align with the Auth Engine.

-- 1. DROP old constraint if exists (Postgres Serial uses nextval)
ALTER TABLE sessions ALTER COLUMN id DROP DEFAULT;

-- 2. CAST ID to UUID (Handles existing numeric IDs as strings)
-- Note: If the table was empty or newly created, this is safe.
ALTER TABLE sessions ALTER COLUMN id TYPE uuid USING (gen_random_uuid());

-- 3. SET NEW DEFAULT
ALTER TABLE sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. VERIFY
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sessions';
