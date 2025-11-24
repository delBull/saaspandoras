-- Migration: Create email_metrics table for storing Resend webhook data
-- This migration should be applied to all 3 databases (local, staging, main)

CREATE TABLE IF NOT EXISTS email_metrics (
  id SERIAL PRIMARY KEY,
  email_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'unknown',
  status VARCHAR(50) NOT NULL DEFAULT 'unknown',
  recipient VARCHAR(255),
  email_subject TEXT,
  clicked_url TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  complaint_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address VARCHAR(45),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique constraint on email_id
-- PostgreSQL will provide better performance for the ON CONFLICT clause
ALTER TABLE email_metrics ADD CONSTRAINT email_metrics_email_id_key UNIQUE (email_id);

-- Create indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_email_metrics_email_id ON email_metrics(email_id);
CREATE INDEX IF NOT EXISTS idx_email_metrics_type_status ON email_metrics(type, status);
CREATE INDEX IF NOT EXISTS idx_email_metrics_status ON email_metrics(status);
CREATE INDEX IF NOT EXISTS idx_email_metrics_recipient ON email_metrics(recipient);
CREATE INDEX IF NOT EXISTS idx_email_metrics_created_at ON email_metrics(created_at);

-- Add a comment to the table
COMMENT ON TABLE email_metrics IS 'Stores email performance metrics from Resend webhooks';

-- Grant permissions for the table (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE ON email_metrics TO your_app_user;
-- GRANT USAGE, SELECT ON email_metrics_id_seq TO your_app_user;

-- Verify table creation
SELECT 'email_metrics table created successfully' AS result;
