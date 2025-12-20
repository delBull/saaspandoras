CREATE TABLE IF NOT EXISTS sow_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    tier VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
