import { DomainPackManifest } from '../../pandoras/core/contracts/pack-contracts';
import { SNARAI_DOMAIN_PACK } from './snarai-domain-pack';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
export class DomainPackNotFound extends Error {
  constructor(tenantId: string) {
    super(`Domain Pack not found for tenant: ${tenantId}`);
    this.name = 'DomainPackNotFound';
  }
}

/**
 * Loads the Domain Pack configuration for a given tenant.
 * In production, this would load from DB/Storage. For now, it routes to static packs.
 */
import { HERMES_INTERNAL_DOMAIN_PACK } from './hermes-internal-domain-pack';

const PACK_REGISTRY: Record<string, DomainPackManifest> = {
  'snarai': SNARAI_DOMAIN_PACK,
  '2': SNARAI_DOMAIN_PACK, // legacy projectId mapping
  'hermes': HERMES_INTERNAL_DOMAIN_PACK
};

export class DomainPackLoader {
  static async load(organizationId: string): Promise<DomainPackManifest> {
    // 1. Resolve from Database
    try {
      const projectRecord = await db.query.projects.findFirst({
        where: or(
          eq(projects.slug, organizationId),
          // Si el organizationId es numérico, probar buscar por id
          ...(!isNaN(Number(organizationId)) ? [eq(projects.id, Number(organizationId))] : [])
        )
      });

      if (projectRecord?.identityPack || projectRecord?.policyPack || projectRecord?.tenantRuntimeConfig) {
        const idPack = (projectRecord.identityPack as Record<string, any>) || {};
        const polPack = (projectRecord.policyPack as Record<string, any>) || {};
        const rtConfig = (projectRecord.tenantRuntimeConfig as Record<string, any>) || {};

        // B2/B3: Retrieve Dynamic Knowledge
        let dynamicFaqs: { question: string; answer: string }[] = [];
        try {
          const { knowledgeChunks } = await import('@/db/schema');
          const chunks = await db.query.knowledgeChunks.findMany({
            where: eq(knowledgeChunks.tenantId, organizationId)
          });
          dynamicFaqs = chunks.map(c => ({
            question: c.sourceId,
            answer: c.content
          }));
        } catch (e) {
          console.error("Error loading knowledge chunks:", e);
        }

        return {
          id: projectRecord.slug,
          name: projectRecord.title,
          version: '1.0.0',
          type: 'organization-pack',
          requires: [],
          provides: [],
          goals: [],
          missions: [],
          actions: [],
          journeys: rtConfig.journeys || [],
          soul: idPack.soul || rtConfig.soul || {
            agentName: projectRecord.title + " Agent",
            role: "assistant",
            persona: "helpful assistant",
            tone: { warmth: "medium", formality: "neutral", emojiPolicy: "sparse" },
            proactivity: { suggestsNextSteps: false, registersFollowUps: false, escalatesToHuman: true },
            forbiddenClaims: []
          },
          knowledgeDef: rtConfig.knowledgeDef || {
            companyName: projectRecord.title,
            industry: "Other",
            products: [],
            pricing: null,
            faqs: dynamicFaqs.length > 0 ? dynamicFaqs : [],
            objections: [],
            documents: []
          },
          policies: Object.keys(polPack).length > 0 ? (polPack as unknown as any) : (rtConfig.policies || {
            financialAdvice: 'forbidden',
            promises: 'forbidden',
            dataCollection: 'standard',
            escalationThreshold: 'medium'
          })
        } as DomainPackManifest;
      }
    } catch (error) {
      console.warn(`[DomainPackLoader] Error reading from DB for ${organizationId}:`, error);
    }

    // 2. Fallback to Local Registry
    const fallbackPack = PACK_REGISTRY[organizationId];
    if (fallbackPack) {
      return fallbackPack;
    }
    
    throw new DomainPackNotFound(organizationId);
  }
}
