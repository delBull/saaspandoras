import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required.');
  console.error('Usage: DATABASE_URL="postgresql://..." bun run scripts/seed-canonical-journeys.mjs');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

/**
 * 🎯 IDEMPOTENT CANONICAL JOURNEYS SEED
 * Seeds default executive journeys (Sales Prospecting, Post-Sale Onboarding, Support Triage)
 * for all tenant projects using their canonical organization_id UUIDs.
 */
async function seedCanonicalJourneys() {
  console.log('🚀 Starting idempotent canonical journeys seed...');

  const projects = await sql`
    SELECT id, slug, organization_id, title 
    FROM projects 
    WHERE organization_id IS NOT NULL;
  `;

  console.log(`Found ${projects.length} projects in database.`);
  let seededCount = 0;

  for (const p of projects) {
    const orgId = p.organization_id;

    // Check if canonical journeys already exist for this organization
    const existing = await sql`
      SELECT id FROM hermes_journeys 
      WHERE organization_id = ${orgId} OR organization_id = ${p.slug};
    `;

    if (existing.length === 0) {
      console.log(`  ➕ Seeding 3 default journeys for '${p.title}' (${p.slug} / ${orgId})...`);

      // 1. Sales Prospecting & Qualification Journey
      const [salesJourney] = await sql`
        INSERT INTO hermes_journeys (organization_id, name, description, version, status, is_default)
        VALUES (${orgId}, 'Sales Prospecting & Qualification', 'Identifica necesidades, presupuesto y perfila clientes potenciales', 1, 'ACTIVE', true)
        RETURNING id;
      `;

      await sql`
        INSERT INTO hermes_journey_stages (journey_id, name, order_index, objectives) VALUES
        (${salesJourney.id}, 'Pain Points & Discovery', 1, '["Identificar necesidades del prospecto", "Entender caso de uso"]'::jsonb),
        (${salesJourney.id}, 'Budget & Feasibility', 2, '["Verificar capacidad de inversion", "Evaluar requerimientos tecnicos"]'::jsonb),
        (${salesJourney.id}, 'Contact Capture', 3, '["Obtener correo o WhatsApp verificado", "Confirmar tomador de decision"]'::jsonb),
        (${salesJourney.id}, 'Proposal & Fast Lane', 4, '["Presentar opcion de inversion o deal room", "Agendar llamada o enviar NDA"]'::jsonb);
      `;

      // 2. Post-Sale Onboarding & DAO Governance Journey
      const [daoJourney] = await sql`
        INSERT INTO hermes_journeys (organization_id, name, description, version, status, is_default)
        VALUES (${orgId}, 'Post-Sale Onboarding & DAO Governance', 'Guía a los nuevos token holders en gobernanza y distribución de rendimientos', 1, 'ACTIVE', false)
        RETURNING id;
      `;

      await sql`
        INSERT INTO hermes_journey_stages (journey_id, name, order_index, objectives) VALUES
        (${daoJourney.id}, 'Token Verification', 1, '["Verificar balance de tokens en wallet", "Confirmar identidad on-chain"]'::jsonb),
        (${daoJourney.id}, 'DAO Orientation', 2, '["Explicar proceso de votacion y cuotas", "Guiar hacia propuestas activas"]'::jsonb),
        (${daoJourney.id}, 'Yield Distribution', 3, '["Explicar calendario de distribucion de dividendos USDC", "Detallar registro en bóveda"]'::jsonb);
      `;

      // 3. Support & Incident Triage Journey
      const [supportJourney] = await sql`
        INSERT INTO hermes_journeys (organization_id, name, description, version, status, is_default)
        VALUES (${orgId}, 'Support & Incident Triage', 'Resolución de consultas operativas y escalamiento institucional', 1, 'ACTIVE', false)
        RETURNING id;
      `;

      await sql`
        INSERT INTO hermes_journey_stages (journey_id, name, order_index, objectives) VALUES
        (${supportJourney.id}, 'Issue Diagnosis', 1, '["Comprender la incidencia tecnica", "Consultar base de conocimiento autorizada"]'::jsonb),
        (${supportJourney.id}, 'Resolution / Escalation', 2, '["Proveer solucion verificada o escalar a cola ejecutiva"]'::jsonb);
      `;

      seededCount += 3;
    } else {
      console.log(`  ✓ Tenant '${p.title}' already has ${existing.length} journeys.`);
    }
  }

  const total = await sql`SELECT count(*)::int as total FROM hermes_journeys;`;
  console.log(`\n✅ Seeding complete. Total journeys in database: ${total[0].total} (+${seededCount} newly created).`);
}

seedCanonicalJourneys().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
