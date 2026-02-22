-- Alert States v2 migration: Trend Memory columns
-- Safe to re-run (IF NOT EXISTS / DO NOTHING)

ALTER TABLE alert_states
    ADD COLUMN IF NOT EXISTS first_seen_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS times_fired_24h   INTEGER NOT NULL DEFAULT 0;

-- P95 latency tracking on gamification executions
ALTER TABLE gamification_action_executions
    ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- Index for fast P95 calculation
CREATE INDEX IF NOT EXISTS idx_gae_executed_duration
    ON gamification_action_executions (executed_at, duration_ms)
    WHERE duration_ms IS NOT NULL;

-- Config drift detection: track economy param changes with timestamps
-- (platform_settings already has updated_at — no new columns needed)
