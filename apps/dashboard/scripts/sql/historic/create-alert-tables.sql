-- Alert States table for Telegram Bridge Alert Engine
-- Run this script manually or integrate into your migration runner

CREATE TABLE IF NOT EXISTS alert_states (
    alert_id         TEXT PRIMARY KEY,
    status           TEXT NOT NULL DEFAULT 'resolved'  CHECK (status IN ('active', 'resolved')),
    last_triggered_at TIMESTAMPTZ,
    last_resolved_at  TIMESTAMPTZ,
    trigger_count    INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast active alert queries
CREATE INDEX IF NOT EXISTS idx_alert_states_status ON alert_states(status);

-- Seed with all known alert IDs in resolved state (prevents false alarms on first run)
INSERT INTO alert_states (alert_id, status, trigger_count)
VALUES
    ('A1_ACCEPTANCE_RATE', 'resolved', 0),
    ('A2_PBOX_INVARIANT', 'resolved', 0),
    ('A3_CLAIM_PIPELINE_STUCK', 'resolved', 0),
    ('A4_WEBHOOK_FAILURE', 'resolved', 0),
    ('W1_WEBHOOK_QUEUE_BUILDING', 'resolved', 0),
    ('W2_EVENT_VOLUME_ZERO', 'resolved', 0),
    ('W3_CLAIM_RESERVATION_HIGH', 'resolved', 0),
    ('I1_PARANOIA_MODE_ACTIVE', 'resolved', 0)
ON CONFLICT (alert_id) DO NOTHING;
