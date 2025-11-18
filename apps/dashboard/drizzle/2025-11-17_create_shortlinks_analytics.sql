-- Create shortlinks analytics table for marketing tracking

CREATE TABLE IF NOT EXISTS shortlink_events (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL,              -- 'w' for /w
  ip VARCHAR(45),                         -- IPv4/IPv6
  user_agent TEXT,                        -- Browser/device
  referer TEXT,                           -- Origin URL
  utm_source VARCHAR(100),                -- google, facebook, etc.
  utm_medium VARCHAR(100),                -- cpc, social, email
  utm_campaign VARCHAR(100),              -- campaign_name
  utm_term VARCHAR(100),                  -- keywords
  utm_content VARCHAR(100),               -- content variation
  device_type VARCHAR(50),                -- mobile, desktop, tablet
  browser VARCHAR(100),                   -- chrome, safari, etc.
  country VARCHAR(10),                    -- MX, US, ES
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_shortlink_events_slug ON shortlink_events(slug);
CREATE INDEX IF NOT EXISTS idx_shortlink_events_created_at ON shortlink_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shortlink_events_utm_source ON shortlink_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_shortlink_events_device_type ON shortlink_events(device_type);
CREATE INDEX IF NOT EXISTS idx_shortlink_events_country ON shortlink_events(country);

-- Grant permissions (adjust according to your setup)
-- GRANT SELECT, INSERT ON shortlink_events TO your_app_user;

-- Optional: Create a view for common analytics queries
-- CREATE VIEW shortlink_daily_stats AS
-- SELECT
--   DATE(created_at) as date,
--   slug,
--   COUNT(*) as total_clicks,
--   COUNT(DISTINCT ip) as unique_ips,
--   COUNT(DISTINCT utm_source) as unique_sources
-- FROM shortlink_events
-- GROUP BY DATE(created_at), slug
-- ORDER BY date DESC, total_clicks DESC;
