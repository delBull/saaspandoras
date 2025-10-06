-- Quick fix: Insert minimal test data
-- Copy and paste this into your PostgreSQL client

INSERT INTO projects (title, slug, description, status) VALUES
('Test Featured Project', 'test-featured-quick', 'Test project for featured system', 'approved')
ON CONFLICT (slug) DO NOTHING;

-- Update it to be featured
UPDATE projects SET
  featured = true,
  featured_button_text = 'Learn More',
  cover_photo_url = '/images/sem.jpeg',
  tagline = 'Test featured project'
WHERE slug = 'test-featured-quick';