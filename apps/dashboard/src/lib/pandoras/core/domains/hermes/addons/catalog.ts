/**
 * 🏛️ Hermes OS — Canonical Add-Ons Catalog (ADR-018 / Milestone K27)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/addons/catalog.ts
 *
 * Defines the standard, production-ready Add-Ons built for Hermes:
 * 1. vip_family_concierge: VIP Family & Referral Trust Concierge
 * 2. family_office_succession: Family Office & Asset Succession Strategy
 * 3. referral_trust_solution: Full-Funnel Referral Trust Solution Pack
 * 4. hermes.channel.portal: Portal Web Channel Extension
 * 5. hermes.capability.investment_guide: RWA & Tokenized Investment Guidance
 */

import { HermesAddOnManifest } from './contracts';
import { AddOnRegistryService } from './registry';
import { db } from '@/db';
import { 
  hermesAddonInstallations, 
  hermesAddonAudit, 
  hermesJourneys, 
  hermesJourneyStages, 
  hermesJourneyTransitions, 
  projects 
} from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const CANONICAL_ADDONS: HermesAddOnManifest[] = [

  {
    id: 'vip_family_concierge',
    name: 'VIP Family Concierge (Referral & Warm Network)',
    version: '1.0.0',
    type: 'COMPOSITE',
    description: 'Estrategia de atención y cualificación para círculos VIP, familias fundadoras y redes de referidos cálidos. Incluye manejo de objeciones patrimoniales/familiares, educación gradual y conexión directa con fundadores.',
    capabilities: [
      {
        id: 'vip_referral_management',
        category: 'JOURNEY',
        description: 'Reconocimiento y trato preferencial de contactos referidos por fundadores y círculos cercanos.',
      },
      {
        id: 'vip_lead_recognition',
        category: 'SIGNAL',
        description: 'Identificación de relaciones de confianza y contexto relacional sin invadir privacidad.',
      },
      {
        id: 'vip_founder_connection',
        category: 'INTEGRATION',
        description: 'Facilitación de llamadas y reuniones directas con el equipo fundador.',
      },
      {
        id: 'vip_contextual_conversation',
        category: 'UTILITY',
        description: 'Manejo empático de objeciones sobre patrimonio familiar y mitigación de riesgo.',
      },
    ],
    knowledgeOverlays: [
      { id: 'family_objections', source: 'knowledge/objections/family.md', category: 'OBJECTION_HANDLING' },
      { id: 'founder_narrative', source: 'knowledge/founder-story.md', category: 'NARRATIVE' },
      { id: 'investment_thesis', source: 'knowledge/investment-thesis.md', category: 'INVESTMENT_THESIS' },
    ],
    journeyDefinitions: [
      { id: 'referral_trust_journey', source: 'journeys/main.md' },
    ],
    styleOverlay: {
      mode: 'institutional_concierge',
      warmth: 'high',
      exclusivity: 'high',
      directness: 'high',
      pressure: 'low',
      personalization: 'high',
    },
    governanceRequirements: {
      requiresHumanApproval: true,
      allowedChannels: ['web', 'whatsapp', 'telegram'],
    },
    compatibility: {
      minHermesVersion: '1.0.0',
    },
    status: 'AVAILABLE',
  },
  {
    id: 'family_office_succession',
    name: 'Family Office & Asset Succession Strategy',
    version: '1.0.0',
    type: 'COMPOSITE',
    description: 'Estructuración de inversión y gobernanza patrimonial para Family Offices y patrimonios familiares (Querétaro, Guadalajara, CDMX, Monterrey, etc.). Proporciona marcos de co-inversión, tokenización fraccionada y reglas de gobierno patrimonial.',
    capabilities: [
      {
        id: 'family_office_governance',
        category: 'JOURNEY',
        description: 'Asesoramiento sobre derechos de co-inversión, representación y sindicación patrimonial.',
      },
      {
        id: 'syndicate_onboarding',
        category: 'INTEGRATION',
        description: 'Facilitación de documentación corporativa y acuerdos de participación familiar.',
      },
      {
        id: 'asset_succession_guidance',
        category: 'UTILITY',
        description: 'Explicación del marco fiduciario, digital y transmisión de derechos patrimoniales.',
      },
    ],
    styleOverlay: {
      mode: 'family_office_advisor',
      warmth: 'medium',
      exclusivity: 'ultra',
      directness: 'high',
      pressure: 'none',
      personalization: 'high',
    },
    governanceRequirements: {
      requiresHumanApproval: true,
      allowedChannels: ['web', 'whatsapp', 'telegram'],
    },
    compatibility: {
      minHermesVersion: '1.0.0',
    },
    status: 'AVAILABLE',
  },
  {
    id: 'referral_trust_solution',
    name: 'Referral Trust Solution Pack',
    version: '1.0.0',
    type: 'JOURNEY_PACK',
    description: 'Solución integral para convertir contactos cálidos de fundadores en inversionistas informados mediante educación gradual, confianza delegada y acompañamiento concierge.',
    capabilities: [
      {
        id: 'trust_qualification',
        category: 'SIGNAL',
        description: 'Evaluación del nivel de interés y capacidad de inversión sin fricción comercial.',
      },
      {
        id: 'delegated_trust_education',
        category: 'JOURNEY',
        description: 'Explicación paso a paso de la propuesta de valor respaldada por el activo subyacente.',
      },
    ],
    journeyDefinitions: [
      { id: 'referral_trust_main', source: 'journeys/main.md' },
    ],
    styleOverlay: {
      mode: 'trusted_advisor',
      warmth: 'high',
      exclusivity: 'medium',
      directness: 'high',
      pressure: 'none',
      personalization: 'high',
    },
    governanceRequirements: {
      requiresHumanApproval: false,
      allowedChannels: ['web', 'whatsapp', 'telegram'],
    },
    compatibility: {
      minHermesVersion: '1.0.0',
    },
    status: 'AVAILABLE',
  },
  {
    id: 'hermes.channel.portal',
    name: 'Portal Channel Integration',
    version: '1.0.0',
    type: 'CHANNEL_EXTENSION',
    description: 'Canal web autenticado para interacción institucional en el Customer Operating Console.',
    capabilities: [
      {
        id: 'portal_communication',
        category: 'INTEGRATION',
        description: 'Envío y recepción de mensajes seguros a través del portal de cliente.',
      },
    ],
    governanceRequirements: {
      requiresHumanApproval: false,
      allowedChannels: ['web'],
    },
    compatibility: {
      minHermesVersion: '1.0.0',
    },
    status: 'AVAILABLE',
  },
  {
    id: 'hermes.capability.investment_guide',
    name: 'Investment & RWA Guidance Engine',
    version: '1.0.0',
    type: 'CAPABILITY',
    description: 'Motor de explicación de tokenomics, certificados de participación, flujo de rendimientos y respaldo inmobiliario.',
    capabilities: [
      {
        id: 'investment_guidance',
        category: 'UTILITY',
        description: 'Explicación de fases, precios, derechos y tokenomics bajo reglas estrictas de no-promesa.',
      },
    ],
    governanceRequirements: {
      requiresHumanApproval: false,
      allowedChannels: ['web', 'whatsapp', 'telegram'],
    },
    compatibility: {
      minHermesVersion: '1.0.0',
    },
    status: 'AVAILABLE',
  },
];

/**
 * Ensures all canonical Add-Ons are registered in the global catalog (hermes_addons table).
 */
export async function ensureCanonicalAddOnsRegistered(): Promise<void> {
  for (const manifest of CANONICAL_ADDONS) {
    await AddOnRegistryService.register(manifest);
  }
}

/**
 * Activates an Add-On for a specific tenant organization.
 */
export async function activateTenantAddOn(
  organizationId: string,
  addonId: string,
  options?: {
    installedBy?: string;
    configuration?: Record<string, unknown>;
  }
): Promise<void> {
  // Ensure the addon is in the catalog first
  const manifest = CANONICAL_ADDONS.find(a => a.id === addonId);
  if (manifest) {
    await AddOnRegistryService.register(manifest);
  }

  const existing = await db
    .select()
    .from(hermesAddonInstallations)
    .where(
      and(
        eq(hermesAddonInstallations.organizationId, organizationId),
        eq(hermesAddonInstallations.addonId, addonId)
      )
    )
    .limit(1);

  const actorId = options?.installedBy || 'system_bootstrap';
  const config = options?.configuration || { enabled: true };
  const now = new Date();

  if (existing.length > 0) {
    const prev = existing[0]!;
    await db
      .update(hermesAddonInstallations)
      .set({
        status: 'ACTIVE',
        activatedAt: now,
        updatedAt: now,
        manifestSnapshot: (manifest || prev.manifestSnapshot) as any,
        configuration: config,
      })
      .where(
        and(
          eq(hermesAddonInstallations.organizationId, organizationId),
          eq(hermesAddonInstallations.addonId, addonId)
        )
      );

    // Audit transition for update/reactivation
    await db.insert(hermesAddonAudit).values({
      id: `evt_${uuidv4()}`,
      organizationId,
      addonId,
      installationId: prev.id,
      eventType: prev.status === 'ACTIVE' ? 'CONFIGURATION_UPDATED' : 'ACTIVATED',
      actorId,
      actorType: 'SYSTEM',
      oldStatus: (prev.status as any) || null,
      newStatus: 'ACTIVE',
      version: manifest?.version || prev.version || '1.0.0',
      reason: prev.status === 'ACTIVE' ? 'Add-On configuration refreshed' : 'Add-On reactivated for tenant',
      createdAt: now,
    });
  } else {
    const installId = `inst_${uuidv4()}`;
    await db.insert(hermesAddonInstallations).values({
      id: installId,
      organizationId,
      addonId,
      version: manifest?.version || '1.0.0',
      status: 'ACTIVE',
      configuration: config,
      installedBy: actorId,
      approvedBy: actorId,
      installedAt: now,
      activatedAt: now,
      updatedAt: now,
      manifestSnapshot: (manifest || {}) as any,
    });

    await db.insert(hermesAddonAudit).values({
      id: `evt_${uuidv4()}`,
      organizationId,
      addonId,
      installationId: installId,
      eventType: 'ACTIVATED',
      actorId,
      actorType: 'SYSTEM',
      oldStatus: null,
      newStatus: 'ACTIVE',
      version: manifest?.version || '1.0.0',
      reason: 'Canonical Add-On activated for tenant',
      createdAt: now,
    });
  }

  // If the Add-On includes journey definitions, provision executable journey in NeonDB
  if (manifest?.journeyDefinitions && manifest.journeyDefinitions.length > 0) {
    try {
      await ensureTenantCanonicalJourney(organizationId);
    } catch (err) {
      console.warn(`[AddOns] Could not auto-provision journey for tenant ${organizationId}:`, err);
    }
  }
}

/**
 * Automatically provisions canonical executable journeys (stages & legal transitions)
 * in NeonDB for the tenant if they don't already exist.
 */
export async function ensureTenantCanonicalJourney(organizationId: string): Promise<void> {
  const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const [project] = await db
    .select({ id: projects.id, slug: projects.slug, orgId: projects.organizationId })
    .from(projects)
    .where(
      or(
        eq(projects.slug, organizationId),
        ...(isUuid(organizationId) ? [eq(projects.organizationId, organizationId)] : [])
      )
    )
    .limit(1);

  if (!project?.slug) return;
  const targetSlug = project.slug;

  const existingJourneys = await db
    .select()
    .from(hermesJourneys)
    .where(
      and(
        eq(hermesJourneys.organizationId, targetSlug),
        eq(hermesJourneys.status, 'ACTIVE')
      )
    )
    .limit(1);

  if (existingJourneys.length > 0) return;

  const journeyId = uuidv4();
  await db.insert(hermesJourneys).values({
    id: journeyId,
    organizationId: targetSlug,
    name: 'Embudo de Confianza & Referidos VIP',
    description: 'Secuencia automatizada para cualificación, educación patrimonial y conexión directa con fundadores.',
    version: 1,
    status: 'ACTIVE',
    isDefault: true,
  });

  const stage1Id = uuidv4();
  const stage2Id = uuidv4();
  const stage3Id = uuidv4();
  const stage4Id = uuidv4();
  const stage5Id = uuidv4();

  await db.insert(hermesJourneyStages).values([
    {
      id: stage1Id,
      journeyId,
      name: 'Bienvenida & Vínculo de Confianza',
      orderIndex: 1,
      objectives: ['Identificar procedencia y vínculo de confianza', 'Establecer tono concierge y responder inquietudes iniciales'] as any,
    },
    {
      id: stage2Id,
      journeyId,
      name: 'Cualificación Patrimonial',
      orderIndex: 2,
      objectives: ['Cualificar interés de participación y horizonte temporal', 'Manejar objeciones iniciales de riesgo'] as any,
    },
    {
      id: stage3Id,
      journeyId,
      name: 'Educación del Activo & Títulos',
      orderIndex: 3,
      objectives: ['Presentar estructura fiduciaria y Títulos de Participación', 'Explicar respaldo del activo subyacente'] as any,
    },
    {
      id: stage4Id,
      journeyId,
      name: 'Conexión con Fundadores (Human Gate)',
      orderIndex: 4,
      objectives: ['Facilitar llamada o reunión con equipo fundador / Family Office', 'Obtener verificación de operador humano'] as any,
    },
    {
      id: stage5Id,
      journeyId,
      name: 'Cierre & Sindicación Formal',
      orderIndex: 5,
      objectives: ['Acompañamiento en firma y acreditación patrimonial'] as any,
    },
  ]);

  await db.insert(hermesJourneyTransitions).values([
    {
      id: uuidv4(),
      journeyId,
      fromStageId: stage1Id,
      toStageId: stage2Id,
      trigger: 'REFERRAL_RECOGNIZED',
      condition: 'Contacto expresa interés y confirma relación de confianza',
      priority: 1,
    },
    {
      id: uuidv4(),
      journeyId,
      fromStageId: stage2Id,
      toStageId: stage3Id,
      trigger: 'INTEREST_CONFIRMED',
      condition: 'Contacto solicita detalles sobre el activo y modelo',
      priority: 1,
    },
    {
      id: uuidv4(),
      journeyId,
      fromStageId: stage3Id,
      toStageId: stage4Id,
      trigger: 'FOUNDER_CALL_REQUESTED',
      condition: 'Contacto solicita reunión o condiciones de sindicación',
      priority: 1,
    },
    {
      id: uuidv4(),
      journeyId,
      fromStageId: stage4Id,
      toStageId: stage5Id,
      trigger: 'DIRECTOR_HANDOFF_COMPLETE',
      condition: 'Operador humano valida y conduce la reunión',
      priority: 1,
    },
  ]);
}
