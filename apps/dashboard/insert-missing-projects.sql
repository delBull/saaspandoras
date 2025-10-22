-- Insertar proyectos faltantes en staging basados en local
-- Solo insertar proyectos que no existen en staging

-- Proyecto BlockBunny (ID: 1)
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
  'BlockBunny',
  'blockbunny',
  'Revolutionary DeFi protocol for yield farming and liquidity provision with gamified rewards system.',
  'Hop into the future of DeFi',
  'tech_startup',
  '100000',
  1000000,
  500000,
  '0.0002',
  'https://blockbunny.io',
  '/images/blockbunny.jpg',
  false,
  'Learn More',
  'approved',
  'Alice Cooper',
  'alice@blockbunny.io',
  '0x121a897f0f5a9b7c44756f40bdb2c8e87d2834fa'
) ON CONFLICT (slug) DO NOTHING;

-- Proyecto Lobo Lokuaz (ID: 2)
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
  'Lobo Lokuaz',
  'lobo-lokuaz',
  'Indigenous-led sustainable forestry project using blockchain for carbon credit tokenization and community governance.',
  'Forest conservation through technology',
  'renewable_energy',
  '200000',
  800000,
  400000,
  '0.0005',
  'https://lobolokuaz.org',
  '/images/lobo.jpg',
  false,
  'Support conservation',
  'pending',
  'Maria Santos',
  'maria@lobolokuaz.org',
  '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
) ON CONFLICT (slug) DO NOTHING;

-- Proyecto Mezcal Bull (ID: 3)
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
  'Mezcal Bull',
  'mezcal-bull',
  'Premium artisanal mezcal brand tokenization project connecting traditional Mexican distillers with global markets.',
  'Traditional spirits, modern investment',
  'art_collectibles',
  '150000',
  600000,
  300000,
  '0.0005',
  'https://mezcalbull.com',
  '/images/mezcal.jpg',
  false,
  'Invest in tradition',
  'approved',
  'Carlos Rodriguez',
  'carlos@mezcalbull.com',
  '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
) ON CONFLICT (slug) DO NOTHING;

-- Proyecto Death Note (ID: 4)
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
  'Death Note',
  'death-note',
  'Revolutionary note-taking and knowledge management platform with blockchain-based content ownership and monetization.',
  'Own your knowledge, monetize your insights',
  'tech_startup',
  '75000',
  500000,
  250000,
  '0.0003',
  'https://deathnote.app',
  '/images/deathnote.jpg',
  false,
  'Join the revolution',
  'pending',
  'David Kim',
  'david@deathnote.app',
  '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
) ON CONFLICT (slug) DO NOTHING;

-- Proyecto Ghost (ID: 5)
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
  'Ghost',
  'ghost',
  'Decentralized privacy-focused social network with end-to-end encryption and anonymous content sharing.',
  'Privacy-first social networking',
  'tech_startup',
  '300000',
  1000000,
  500000,
  '0.0006',
  'https://ghost.network',
  '/images/ghost.jpg',
  false,
  'Protect your privacy',
  'draft',
  'Emma Wilson',
  'emma@ghost.network',
  '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
) ON CONFLICT (slug) DO NOTHING;

-- Proyecto Shala (ID: 6)
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
  'Shala',
  'shala',
  'Mindfulness and meditation platform with AI-powered personalized wellness programs and community support.',
  'Find your inner peace through technology',
  'tech_startup',
  '100000',
  750000,
  375000,
  '0.00027',
  'https://shalameditation.com',
  '/images/shala.jpg',
  false,
  'Start your journey',
  'draft',
  'Lisa Chen',
  'lisa@shalameditation.com',
  '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
) ON CONFLICT (slug) DO NOTHING;

-- Proyecto HAF (ID: 7)
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
  'HAF',
  'haf',
  'High Altitude Farming project using vertical farming technology and hydroponics for sustainable food production.',
  'Farming for the future',
  'renewable_energy',
  '175000',
  900000,
  450000,
  '0.00039',
  'https://haf.farm',
  '/images/haf.jpg',
  false,
  'Invest in food security',
  'pending',
  'Robert Johnson',
  'robert@haf.farm',
  '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
) ON CONFLICT (slug) DO NOTHING;

-- Proyecto Rabbitty (ID: 8)
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
  'Rabbitty',
  'rabbitty',
  'La mejor app de recompensas y cashback con tecnología blockchain para maximizar el valor de tus compras diarias.',
  'Gana mientras gastas',
  'tech_startup',
  '125000',
  1000000,
  500000,
  '0.00025',
  'https://rabbitty.me',
  '/images/rabbitty.jpg',
  false,
  'Empieza a ganar',
  'approved',
  'Ana Garcia',
  'ana@rabbitty.me',
  '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
) ON CONFLICT (slug) DO NOTHING;

-- Verificar los cambios
SELECT
  p."id",
  p."title",
  p."slug",
  p."status",
  p."applicant_wallet_address",
  CASE
    WHEN p."applicant_wallet_address" IS NOT NULL THEN '✅ Asignada'
    ELSE '❌ Sin asignar'
  END as "estado_wallet"
FROM "projects" p
ORDER BY p."id";
