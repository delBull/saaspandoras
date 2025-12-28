ALTER TABLE clients ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
