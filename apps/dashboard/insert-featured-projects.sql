-- Insert featured projects directly into database
-- Run this in your PostgreSQL client

-- First, let's try to insert with minimal fields to avoid schema issues
INSERT INTO projects (
  title,
  slug,
  description,
  status,
  featured,
  featured_button_text,
  cover_photo_url
) VALUES
(
  'EcoGreen Energy Featured',
  'ecogreen-energy-featured',
  'Revolutionary renewable energy project using blockchain technology to democratize green power generation and distribution.',
  'approved',
  true,
  'Learn More',
  '/images/sem.jpeg'
),
(
  'TechStart AI Featured',
  'techstart-ai-featured',
  'AI-powered startup revolutionizing automation and machine learning solutions for businesses worldwide.',
  'approved',
  true,
  'Join the AI revolution',
  '/images/blockbunny.jpg'
),
(
  'Artisan Marketplace Featured',
  'artisan-marketplace-featured',
  'Blockchain-based marketplace connecting artisans directly with customers, ensuring fair compensation and authenticity.',
  'approved',
  true,
  'Support artisans',
  '/images/narailoft.jpg'
) ON CONFLICT (slug) DO NOTHING;

-- Verify the insertions
SELECT id, title, featured, featured_button_text, status FROM projects WHERE featured = true;