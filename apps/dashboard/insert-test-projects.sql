-- Insertar proyectos de ejemplo directamente en la base de datos
-- Ejecutar esto directamente en tu cliente de PostgreSQL o en la consola de la DB

INSERT INTO projects (
  title, slug, description, tagline, business_category,
  target_amount, total_tokens, tokens_offered, token_price_usd,
  website, cover_photo_url, featured, featured_button_text, status,
  applicant_name, applicant_email, applicant_wallet_address
) VALUES
(
  'EcoGreen Energy',
  'ecogreen-energy',
  'Revolutionary renewable energy project using blockchain technology to democratize green power generation and distribution.',
  'Power the future with sustainable energy',
  'renewable_energy',
  '250000',
  1000000,
  500000,
  '0.0005',
  'https://ecogreen.energy',
  '/images/sem.jpeg',
  true,
  'Learn More',
  'approved',
  'John Smith',
  'john@ecogreen.energy',
  '0x1234567890123456789012345678901234567890'
),
(
  'TechStart AI',
  'techstart-ai',
  'AI-powered startup revolutionizing automation and machine learning solutions for businesses worldwide.',
  'AI for everyone, everywhere',
  'tech_startup',
  '150000',
  750000,
  375000,
  '0.0004',
  'https://techstart.ai',
  '/images/blockbunny.jpg',
  true,
  'Join the AI revolution',
  'approved',
  'Sarah Johnson',
  'sarah@techstart.ai',
  '0x0987654321098765432109876543210987654321'
),
(
  'Artisan Marketplace',
  'artisan-marketplace',
  'Blockchain-based marketplace connecting artisans directly with customers, ensuring fair compensation and authenticity.',
  'Art made fair, trade made transparent',
  'art_collectibles',
  '75000',
  500000,
  250000,
  '0.0003',
  'https://artisan.market',
  '/images/narailoft.jpg',
  false,
  'Support artisans',
  'pending',
  'Michael Chen',
  'michael@artisan.market',
  '0xabcdef1234567890abcdef1234567890abcdef12'
) ON CONFLICT (slug) DO NOTHING;