-- Add featured columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured_button_text TEXT DEFAULT 'Learn More';

-- Add comment for documentation
COMMENT ON COLUMN projects.featured IS 'Whether this project should be displayed as featured on the homepage';
COMMENT ON COLUMN projects.featured_button_text IS 'Custom text for the featured button';