
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "";
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function seedNarai() {
  console.log("🚀 Seeding Narai Real Estate project...");

  const description = `Narai es un ecosistema de participación de utilidad de lujo ubicado en la Zona Dorada de Bucerías. No vendemos "ladrillos" tradicionales, sino Certificados de Participación que otorgan derechos de uso y beneficios económicos sobre un activo inmobiliario premium.

Propuesta de Valor: "Smart Utility". El usuario tiene acceso a estancias de lujo y plusvalía sin las complicaciones de administración o el costo total de una propiedad.

### Amenidades Narai (High-End)
- **Infinity Pool Rooftop:** Vista al océano Pacífico.
- **Organic Architecture:** Diseño integrado con la naturaleza de la Riviera Nayarit.
- **Wellness Center:** Gimnasio de lujo y áreas de relajación.
- **Concierge 24/7:** Gestión hotelera de 5 estrellas.

### Estrategia de Salida (Liquidez)
- **Mercado Interno:** Tablero de transferencia donde los miembros pueden ceder sus derechos a nuevos interesados.
- **Plusvalía de Salida:** Proyectada en 12-15% anual sobre el valor del certificado.`;

  const w2eConfig = {
    phases: [
      { id: "q1_2026", title: "Incubación", date: "2026-Q1", description: "Diseño legal y financiero en Pandoras." },
      { id: "q3_2026", title: "Obra (Cimentación)", date: "2026-Q3", description: "Hito del 50% de fondeo requerido." },
      { id: "q1_2027", title: "Estructura", date: "2027-Q1", description: "Levantamiento del edificio." },
      { id: "q3_2027", title: "Entrega (Activación)", date: "2027-Q3", description: "Inicio de operación hotelera." }
    ],
    tiers: [
      { name: "Explorador", range: "1 - 100", perks: ["Noches básicas", "Acceso al ecosistema"], multiplier: 1.0, icon: "Compass" },
      { name: "Residente", range: "101 - 500", perks: ["+1.1x Multiplicador", "Noches extra"], multiplier: 1.1, icon: "Home" },
      { name: "Embajador", range: "501 - 2,000", perks: ["+1.3x Multiplicador", "Acceso VIP", "Reservas prioritarias"], multiplier: 1.3, icon: "ShieldCheck" },
      { name: "Riviera Owner", range: "2,001+", perks: ["+1.5x Multiplicador", "Uso comercial de licencias", "Concierge personal"], multiplier: 1.5, icon: "Crown" }
    ],
    tokenomics: {
      price: 50.00,
      ticker: "NARAI",
      totalSupply: 100000,
      targetUsd: 5000000
    }
  };

  try {
    // Upsert the project by ID or slug
    const result = await sql`
      INSERT INTO projects (
        id, title, slug, tagline, description, business_category, 
        target_amount, total_valuation_usd, token_price_usd, total_tokens, tokens_offered,
        protocl_mecanism, artefact_utility, worktoearn_mecanism, legal_status,
        w2e_config, status, created_at, updated_at
      ) VALUES (
        1, 'Narai Real Estate', 'narai', 'Conviértete en propietario de la Riviera... sin comprar todo el edificio.',
        ${description}, 'residential_real_estate', 100000000.00, 5000000.00, 50.00, 100000, 100000,
        'Pure Utility: Derechos de Uso (Lifestyle) y Derechos de Renta (Ingresos). Gestión por Property Manager.',
        'Noches garantizadas + Distribución trimestral de ingresos por renta hotelera.',
        'Participación en gobernanza operativa y comercialización de licencias (niveles altos).',
        'S.A.P.I. de C.V. + Fideicomiso Maestro Irrevocable + Trazabilidad digital NOM-151.',
        ${sql.json(w2eConfig)}, 'approved', NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        slug = EXCLUDED.slug,
        tagline = EXCLUDED.tagline,
        description = EXCLUDED.description,
        business_category = EXCLUDED.business_category,
        target_amount = EXCLUDED.target_amount,
        total_valuation_usd = EXCLUDED.total_valuation_usd,
        token_price_usd = EXCLUDED.token_price_usd,
        total_tokens = EXCLUDED.total_tokens,
        tokens_offered = EXCLUDED.tokens_offered,
        protocl_mecanism = EXCLUDED.protocl_mecanism,
        artefact_utility = EXCLUDED.artefact_utility,
        worktoearn_mecanism = EXCLUDED.worktoearn_mecanism,
        legal_status = EXCLUDED.legal_status,
        w2e_config = EXCLUDED.w2e_config,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id, title, slug
    `;

    console.log("✅ Seed successful:");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedNarai();
