import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL);

async function seedAccessProject() {
  console.log("🛠️ Seeding pandoras_access project...");
  try {
    const config = {
      phases: [{ id: "access", title: "Institutional Access", date: "2026", description: "Onboarding and verification." }],
      tokenomics: { ticker: "ACCESS", price: 0 }
    };

    await sql`
      INSERT INTO projects (
        id, title, slug, tagline, description, business_category, 
        target_amount, total_valuation_usd, token_price_usd, total_tokens, tokens_offered,
        status, w2e_config, created_at, updated_at
      ) VALUES (
        3, 'Pandora''s Access', 'pandoras_access', 'Portal de acceso institucional.',
        'Puerta de entrada al ecosistema Pandoras para inversores y builders.', 
        'infrastructure', 0, 0, 0, 0, 0,
        'approved', ${sql.json(config)}, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET slug = 'pandoras_access', title = 'Pandora''s Access'
    `;
    console.log("✅ Project 'pandoras_access' (ID: 3) seeded.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to seed project:", err);
    process.exit(1);
  }
}

seedAccessProject();
