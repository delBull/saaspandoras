import { HermesAddOnManifest } from './contracts';
import { db } from '@/db';
import { hermesAddonInstallations, hermesKnowledge, projects, installedProducts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { KnowledgeDimensionDefinitionRegistry } from '../knowledge/registry';
import { KnowledgeDimension, GovernedKnowledgeItem } from '../knowledge/types';

export interface CoreSecurityContext {
  organizationId: string;
  tenantId: string;
  projectId: string;
  authorizedChannels: string[];
  llmConfig?: {
    baseUrl?: string;
    model?: string;
    apiKey?: string;
  };
}

export interface TenantKnowledge {
  soul: {
    mode: string;
    warmth: string;
    exclusivity: string;
    directness: string;
    informality: string;
  };
  activePacks: any[];
}

export interface DimensionIntelligenceScore {
  dimension: KnowledgeDimension;
  title: string;
  totalClaims: number;
  activeClaims: number;
  pendingClaims: number;
  completenessPercent: number;
}

export interface ConversationContext {
  core: CoreSecurityContext;
  knowledge: any[];
  style: any;
  activeCapabilities: any[];
  intelligenceScores: DimensionIntelligenceScore[];
  diagnostics?: {
    activeAddOns: string[];
    excludedAddOns: { id: string; status: string }[];
  };
}

export class CognitiveContextBuilder {
  static async buildEffectiveContext(tenantId: string, contactId: string): Promise<ConversationContext> {
    const coreContext = await this.buildCoreSecurityContext(tenantId);
    
    // 1. Fetch Tenant Knowledge (ACTIVE)
    const knowledgeRecords = await db
      .select()
      .from(hermesKnowledge)
      .where(eq(hermesKnowledge.organizationId, tenantId));
      
    const activeKnowledge = knowledgeRecords.filter(k => k.status === 'ACTIVE');
    
    // 1.1 Calculate Intelligence Scores
    const intelligenceScores = this.calculateIntelligenceScores(knowledgeRecords as unknown as any[]);

    // For context-merger, pass ALL records so the ContextAdapter can enforce
    // the ACTIVE-only filter with proper exclusion tracing.
    const tenantKnowledge = await this.getTenantKnowledge(tenantId, knowledgeRecords as unknown as any[]);
    
    // 2. Fetch ALL Add-Ons for Tenant from the DB (to determine ACTIVE vs EXCLUDED)
    const records = await db
      .select()
      .from(hermesAddonInstallations)
      .where(eq(hermesAddonInstallations.organizationId, tenantId));

    const activeRecords = records.filter(r => r.status === 'ACTIVE');
    const excludedRecords = records.filter(r => r.status !== 'ACTIVE');

    // Filter to ensure manifestSnapshot exists
    const activeAddOns = activeRecords
      .filter(r => !!r.manifestSnapshot)
      .map(r => r.manifestSnapshot as unknown as HermesAddOnManifest);

    // 3. Resolve Overlays
    const styleOverlay = this.resolveStyleConflicts(tenantKnowledge.soul, activeAddOns);
    const knowledgeOverlay = this.resolveKnowledgeConflicts(tenantKnowledge, activeAddOns);
    
    // 4. Build Effective Runtime
    return {
      core: coreContext,
      knowledge: [...tenantKnowledge.activePacks, ...knowledgeOverlay],
      style: styleOverlay,
      activeCapabilities: activeAddOns.flatMap(a => a.capabilities || []),
      intelligenceScores,
      diagnostics: {
        activeAddOns: activeRecords.map(r => r.addonId),
        excludedAddOns: excludedRecords.map(r => ({ id: r.addonId, status: r.status }))
      }
    };
  }

  static async getIntelligenceScores(tenantId: string): Promise<DimensionIntelligenceScore[]> {
    const knowledgeRecords = await db
      .select()
      .from(hermesKnowledge)
      .where(eq(hermesKnowledge.organizationId, tenantId));
      
    return this.calculateIntelligenceScores(knowledgeRecords as unknown as any[]);
  }

  private static calculateIntelligenceScores(records: any[]): DimensionIntelligenceScore[] {
    const definitions = KnowledgeDimensionDefinitionRegistry.getAllDefinitions();
    return definitions.map(def => {
      const dimensionRecords = records.filter(r => r.dimension === def.id);
      
      const activeClaimsCount = new Set(dimensionRecords.filter(r => r.status === 'ACTIVE').map(r => r.key)).size;
      const pendingClaimsCount = new Set(dimensionRecords.filter(r => r.status === 'PENDING_REVIEW').map(r => r.key)).size;
      const expectedCount = def.expectedClaims.length;

      let completenessPercent = expectedCount === 0 ? 100 : Math.round((activeClaimsCount / expectedCount) * 100);
      if (completenessPercent > 100) completenessPercent = 100; // Cap at 100%

      return {
        dimension: def.id,
        title: def.title,
        totalClaims: dimensionRecords.length,
        activeClaims: activeClaimsCount,
        pendingClaims: pendingClaimsCount,
        completenessPercent
      };
    });
  }

  private static async buildCoreSecurityContext(tenantId: string): Promise<CoreSecurityContext> {
    if (tenantId === 'pandoras' || tenantId === 'pandoras-core') {
      return {
        organizationId: 'pandoras',
        tenantId: 'pandoras',
        projectId: 'pandoras_core',
        authorizedChannels: ['whatsapp', 'telegram', 'portal'],
        llmConfig: undefined
      };
    }

    const projectRecords = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, tenantId))
      .limit(1);

    const project = projectRecords[0];
    let llmConfig: any = undefined;

    if (project) {
      const productRecords = await db
        .select()
        .from(installedProducts)
        .where(and(
           eq(installedProducts.projectId, project.id),
           eq(installedProducts.product, 'HERMES')
        ))
        .limit(1);
      const firstProduct = productRecords[0];
      if (firstProduct && firstProduct.config) {
         llmConfig = (firstProduct.config as any).llm;
      }
    }

    return {
      organizationId: 'pandoras',
      tenantId,
      projectId: project?.id?.toString() || 'project_1',
      authorizedChannels: ['telegram', 'whatsapp'],
      llmConfig
    };
  }

  private static async getTenantKnowledge(tenantId: string, activeKnowledge: any[]): Promise<TenantKnowledge> {
    const isPandorasCore = tenantId === 'pandoras' || tenantId === 'pandoras-core';

    return {
      soul: {
        mode: isPandorasCore ? 'institutional' : 'standard',
        warmth: isPandorasCore ? 'high' : 'medium',
        exclusivity: isPandorasCore ? 'high' : 'low',
        directness: 'high',
        informality: isPandorasCore ? 'low' : 'high'
      },
      activePacks: [
        { id: 'base_faq' },
        ...(isPandorasCore ? [
          { id: 'pandoras_core_identity', key: 'organization_name', content: "Pandora's Growth OS", status: 'ACTIVE', dimension: 'identity' },
          { id: 'pandoras_core_agent', key: 'agent_name', content: "Hermes", status: 'ACTIVE', dimension: 'identity' },
          { id: 'pandoras_core_mission', key: 'mission', content: "Pandora's es el Growth OS y ecosistema institucional de tokenización de activos del mundo real (RWA), inteligencia crediticia y plataforma de agentes cognitivos Hermes OS.", status: 'ACTIVE', dimension: 'identity' }
        ] : []),
        ...activeKnowledge.map(k => ({
          id: k.id,
          type: k.dimension,
          key: k.key,
          content: k.content,
          status: k.status,         // ← propagate so adapter can filter
          visibility: k.visibility, // ← propagate for K11-A10
          dimension: k.dimension,
        }))
      ]
    };
  }

  private static resolveStyleConflicts(tenantSoul: any, addOns: HermesAddOnManifest[]) {
    // Regla: Tenant Soul > Add-On Style
    let effectiveStyle = { ...tenantSoul };
    
    for (const addon of addOns) {
      if (addon.styleOverlay) {
        if (addon.styleOverlay.exclusivity === 'high') {
          effectiveStyle.exclusivity = 'high';
          effectiveStyle.mode = addon.styleOverlay.mode;
        }
      }
    }
    
    return effectiveStyle;
  }

  private static resolveKnowledgeConflicts(tenantKnowledge: any, addOns: HermesAddOnManifest[]) {
    return addOns.flatMap(a => a.knowledgeOverlays || []);
  }
}
