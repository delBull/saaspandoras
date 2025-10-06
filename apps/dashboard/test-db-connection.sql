-- Test simple database connection and insert one project
-- Run this in your PostgreSQL client

-- First, test if we can connect and query
SELECT COUNT(*) as project_count FROM projects;

-- Insert just one test project
INSERT INTO projects (
  title,
  slug,
  description,
  tagline,
  business_category,
  target_amount,
  total_tokens,
  tokens_offered,
  token_price_usd,
  website,
  cover_photo_url,
  featured,
  featured_button_text,
  status,
  applicant_name,
  applicant_email,
  applicant_wallet_address
) VALUES (
  'Test Project',
  'test-project-' || EXTRACT(EPOCH FROM NOW()),
  'This is a test project to verify database connectivity and featured functionality.',
  'Test project for featured system',
  'tech_startup',
  '100000',
  1000000,
  500000,
  '0.0002',
  'https://testproject.com',
  '/images/sem.jpeg',
  true,
  'Learn More',
  'approved',
  'Test User',
  'test@testproject.com',
  '0x1234567890123456789012345678901234567890'
) ON CONFLICT (slug) DO NOTHING;

-- Verify the project was inserted
SELECT id, title, featured, featured_button_text FROM projects WHERE title = 'Test Project' ORDER BY created_at DESC LIMIT 1;