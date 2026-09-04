import 'dotenv/config';
import { db } from '../src/db/index.js';
import { hermesKnowledge } from '../src/db/schema.js';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const TENANT_ID = 'pandoras';

const KNOWLEDGE_PACKS = [
  {
    dimension: 'SYSTEM_PROMPT',
    key: 'discord_orchestrator_persona',
    content: `Eres Hermes, el Agente Inteligente y Orquestador del Ecosistema de Pandoras Growth OS.
Actualmente estás comunicándote en el Discord Interno del Equipo de Colaboradores.
Tu tono debe ser operativo, preciso, analítico y colaborativo. No estás hablando con usuarios finales, estás hablando con los administradores, operadores (Nexus) y fundadores.
Tu objetivo aquí es ayudarles a operar los subdominios de negocios, escalar tickets, consultar información de tenants y optimizar los flujos de Human-in-the-loop (HITL).
Siempre responde en español, usa Markdown para estructurar tus respuestas (listas, negritas) y sé directo.`,
    status: 'ACTIVE',
    visibility: 'PRIVATE',
    classification: 'TENANT_RESTRICTED',
    authority: 'SYSTEM_DEFAULT',
    version: 1,
    source: 'SYSTEM',
    createdBy: 'system'
  },
  {
    dimension: 'BUSINESS_CONTEXT',
    key: 'nexus_command_center',
    content: `El Nexus Command Center es el lugar donde los operadores humanos gestionan las escalaciones de los distintos Tenants (ej. S'Narai, Pandoras MiniApp).
Como orquestador de Discord, tú (Hermes) recibes alertas de estos tenants y puedes ser consultado sobre el estado de la plataforma.
Enlaces útiles que puedes proveer a los colaboradores:
- Nexus Global: https://dashboard.pandoras.finance/nexus
- Dashboard Principal: https://dashboard.pandoras.finance/
- Soporte Técnico: https://dashboard.pandoras.finance/help`,
    status: 'ACTIVE',
    visibility: 'PRIVATE',
    classification: 'TENANT_RESTRICTED',
    authority: 'SYSTEM_DEFAULT',
    version: 1,
    source: 'SYSTEM',
    createdBy: 'system'
  }
];

async function seed() {
  console.log(`[Seed] Inyectando RAG Packs para el orchestrador interno en el tenant '${TENANT_ID}'...`);
  
  for (const pack of KNOWLEDGE_PACKS) {
    // Check if exists
    const existing = await db
      .select()
      .from(hermesKnowledge)
      .where(
        and(
          eq(hermesKnowledge.organizationId, TENANT_ID),
          eq(hermesKnowledge.key, pack.key)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`- Actualizando pack: ${pack.key}`);
      await db.update(hermesKnowledge)
        .set({ 
          content: pack.content, 
          status: pack.status, 
          authority: pack.authority,
          version: pack.version,
          source: pack.source,
          updatedAt: new Date() 
        })
        .where(eq(hermesKnowledge.id, existing[0].id));
    } else {
      console.log(`- Insertando pack: ${pack.key}`);
      await db.insert(hermesKnowledge).values({
        id: `k_${crypto.randomUUID()}`,
        organizationId: TENANT_ID,
        ...pack
      });
    }
  }

  console.log('[Seed] Conocimiento inyectado correctamente.');
  process.exit(0);
}

seed().catch(console.error);
