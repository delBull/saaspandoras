/**
 * ECOSYSTEM SEEDER (PRO VERSION)
 * 🚀 Orquesta la inicialización de los protocolos Pandoras y Narai.
 * 
 * Uso: npm run db:seed:ecosystem
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = postgres(DATABASE_URL);

async function seedFinal() {
  console.log("🚀 Starting Ecosystem Initializer (Pandoras Core + Narai Real Estate)...");

  try {
    // 1. Limpieza selectiva para evitar duplicados
    await sql`DELETE FROM projects WHERE slug IN ('narai', 'pandoras') OR id IN (1, 2)`;
    console.log("🧹 Cleanup complete.");

    // 2. Configuración Pandoras Finance (Project 1)
    const pandorasConfig = {
      phases: [
        { id: "gen_2026", title: "Protocol Genesis", date: "2026-Q1", description: "Lanzamiento de infraestructura core de RWAs." }
      ],
      tiers: [
        { name: "Builder", range: "0 - 1000", perks: ["Acceso a APIs"], multiplier: 1.0, icon: "Code" },
        { name: "Architect", range: "1001+", perks: ["Gobernanza activa"], multiplier: 1.5, icon: "Monitor" }
      ],
      tokenomics: { price: 1.0, ticker: "PBOX", totalSupply: 1000000, targetUsd: 1000000 }
    };

    await sql`
      INSERT INTO projects (
        id, title, slug, tagline, description, business_category, 
        target_amount, total_valuation_usd, token_price_usd, total_tokens, tokens_offered,
        status, w2e_config, created_at, updated_at
      ) VALUES (
        1, 'Pandora''s Finance', 'pandoras', 'La Infraestructura de Crecimiento para la Nueva Economía.',
        'Protocolo base que orquesta la liquidez y el crecimiento de activos del mundo real (RWA).', 
        'infrastructure', 1000000.00, 1000000.00, 1.00, 1000000, 1000000,
        'approved', ${sql.json(pandorasConfig)}, NOW(), NOW()
      )
    `;
    console.log("✅ Project 1 (Pandoras Finance) established.");

    // 3. Configuración Narai Real Estate (Project 2)
    const naraiDescription = `Narai es un ecosistema de participación de utilidad de lujo ubicado en la Zona Dorada de Bucerías.

Propuesta de Valor: "Smart Utility". El usuario tiene acceso a estancias de lujo y plusvalía sin las complicaciones de administración.

### Amenidades Narai
- **Infinity Pool Rooftop:** Vista al océano Pacífico.
- **Organic Architecture:** Diseño integrado con la naturaleza.
- **Wellness Center:** Gimnasio de lujo y relajación.
- **Concierge 24/7:** Gestión hotelera de 5 estrellas.`;

    const naraiConfig = {
      phases: [
        { id: "q1_26", title: "Incubación", date: "2026-Q1", description: "Diseño legal y financiero." },
        { id: "q3_26", title: "Fase de Obra", date: "2026-Q3", description: "Hito del 50% de fondeo requerido ($2.5M USD)." },
        { id: "q1_27", title: "Estructura", date: "2027-Q1", description: "Levantamiento del edificio." },
        { id: "q3_27", title: "Entrega", date: "2027-Q3", description: "Inicio de operación hotelera." }
      ],
      tiers: [
        { name: "Explorador", range: "1 - 100", perks: ["Acceso básico", "Noches garantizadas"], multiplier: 1.0, icon: "Compass" },
        { name: "Residente", range: "101 - 500", perks: ["Bonus 1.1x", "Noches extra"], multiplier: 1.1, icon: "Home" },
        { name: "Embajador", range: "501 - 2,000", perks: ["Bonus 1.3x", "Acceso VIP"], multiplier: 1.3, icon: "ShieldCheck" },
        { name: "Riviera Owner", range: "2,001+", perks: ["Bonus 1.5x", "Concierge personal"], multiplier: 1.5, icon: "Crown" }
      ],
      tokenomics: {
        price: 50.00,
        ticker: "NARAI",
        totalSupply: 100000,
        targetUsd: 5000000
      }
    };

    await sql`
      INSERT INTO projects (
        id, title, slug, tagline, description, business_category, 
        target_amount, total_valuation_usd, token_price_usd, total_tokens, tokens_offered,
        legal_status, w2e_config, status, created_at, updated_at
      ) VALUES (
        2, 'Narai Real Estate', 'narai', 'Conviértete en propietario de la Riviera... sin comprar todo el edificio.',
        ${naraiDescription}, 'residential_real_estate', 100000000.00, 5000000.00, 50.00, 100000, 100000,
        'S.A.P.I. de C.V. + Fideicomiso Maestro + NOM-151.',
        ${sql.json(naraiConfig)}, 'approved', NOW(), NOW()
      )
    `;
    console.log("✅ Project 2 (Narai Real Estate) established.");

    console.log("🎉 Seeding complete. The ecosystem is now ready in the Growth OS.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedFinal();
