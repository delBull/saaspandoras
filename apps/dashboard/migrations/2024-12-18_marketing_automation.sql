-- Marketing Automation Tables Migration
-- Created: 2024-12-18
-- Description: Adds marketing_campaigns and marketing_executions tables for the Global Marketing OS

-- Create trigger_type enum
DO $$ BEGIN
    CREATE TYPE trigger_type AS ENUM ('manual', 'auto_registration', 'api_event');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create execution_status enum
DO $$ BEGIN
    CREATE TYPE execution_status AS ENUM ('active', 'paused', 'completed', 'intercepted', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trigger_type trigger_type DEFAULT 'manual' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    config JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create marketing_executions table
CREATE TABLE IF NOT EXISTS marketing_executions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255),
    lead_id VARCHAR(36),
    campaign_id INTEGER NOT NULL REFERENCES marketing_campaigns(id),
    status execution_status DEFAULT 'active' NOT NULL,
    current_stage_index INTEGER DEFAULT 0 NOT NULL,
    next_run_at TIMESTAMP,
    history_log JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_executions_status ON marketing_executions(status);
CREATE INDEX IF NOT EXISTS idx_marketing_executions_next_run ON marketing_executions(next_run_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_marketing_executions_campaign_id ON marketing_executions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_executions_lead_id ON marketing_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_marketing_executions_user_id ON marketing_executions(user_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Marketing Automation tables created successfully';
END $$;
