-- Simple test project insertion - only essential fields
-- This should work even if the migration had issues

INSERT INTO projects (
  title,
  slug,
  description,
  status
) VALUES (
  'Test Featured Project',
  'test-featured-project-' || EXTRACT(EPOCH FROM NOW()),
  'This is a test project to verify the featured system is working correctly.',
  'approved'
) ON CONFLICT (slug) DO NOTHING;

-- Update the project to be featured
UPDATE projects
SET
  featured = true,
  featured_button_text = 'Learn More',
  cover_photo_url = '/images/sem.jpeg',
  tagline = 'Test featured project'
WHERE title = 'Test Featured Project'
  AND featured IS NULL;