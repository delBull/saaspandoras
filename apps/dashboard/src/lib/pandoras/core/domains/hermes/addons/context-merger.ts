import { HermesAddOnManifest } from './contracts';
import { db } from '@/db';
import { hermesAddonInstallations, hermesKnowledge, hermesKnowledgeRegistry, projects, installedProducts } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { KnowledgeDimensionDefinitionRegistry } from '../knowledge/registry';
import { KnowledgeDimension, GovernedKnowledgeItem } from '../knowledge/types';
import { ExecutiveScopeValidator } from '@/lib/pandoras/core/domains/academy/security/scope-validator';
import { RuntimeExecutionContext, ClassifiedKnowledgeDocument } from '@/lib/pandoras/core/domains/academy/security/types';

export interface CoreSecurityContext {
  organizationId: string;
  organizationName?: string;
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

const isUuid = (val?: string): boolean => 
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export class CognitiveContextBuilder {
  static async buildEffectiveContext(tenantId: string, contactId: string): Promise<ConversationContext> {
    const coreContext = await this.buildCoreSecurityContext(tenantId);
    
    // Resolve project identifiers for multi-tenant resilience
    const tenantIsUuid = isUuid(tenantId);
    const [project] = await db
      .select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        orgId: projects.organizationId,
      })
      .from(projects)
      .where(
        or(
          eq(projects.slug, tenantId),
          ...(tenantIsUuid ? [eq(projects.organizationId, tenantId)] : []),
          eq(projects.slug, 'snarai')
        )
      )
      .limit(1);

    const resolvedSlug = project?.slug || tenantId;
    const resolvedOrgId = project?.orgId || tenantId;

    // 1. Fetch Tenant Knowledge (ACTIVE) from hermesKnowledge
    const rawRecords = await db
      .select()
      .from(hermesKnowledge)
      .where(
        or(
          eq(hermesKnowledge.organizationId, tenantId),
          eq(hermesKnowledge.organizationId, resolvedSlug),
          eq(hermesKnowledge.organizationId, resolvedOrgId),
          eq(hermesKnowledge.organizationId, 'snarai')
        )
      );

    // 1b. Fetch Sovereign IPFS knowledge artifacts from hermesKnowledgeRegistry
    const ipfsRecords = await db
      .select()
      .from(hermesKnowledgeRegistry)
      .where(
        or(
          eq(hermesKnowledgeRegistry.tenantId, tenantId),
          eq(hermesKnowledgeRegistry.tenantId, resolvedSlug),
          eq(hermesKnowledgeRegistry.tenantId, resolvedOrgId),
          eq(hermesKnowledgeRegistry.tenantId, 'snarai')
        )
      );

    const mappedIpfsKnowledge = ipfsRecords.map(r => ({
      id: `ipfs_${r.id}`,
      organizationId: r.tenantId,
      dimension: 'IPFS_SOVEREIGN_VAULT',
      key: `${r.domain || 'DOCUMENT'}: ${r.artifactId}`,
      content: `[Sovereign IPFS Document]\nArtifact: ${r.artifactId}\nDomain: ${r.domain}\nCID: ${r.ipfsCid}\nGovernance Status: ${r.governanceStatus}\nClassification: ${r.classification}`,
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      classification: r.classification || 'PUBLIC',
      version: r.version,
    }));

    const allCombinedRecords = [...rawRecords, ...mappedIpfsKnowledge];

    const execContext: RuntimeExecutionContext = {
      organizationId: tenantId,
      organizationType: tenantId === 'pandoras_internal' ? 'INTERNAL' : 'TENANT',
      application: 'HERMES_PORTAL',
      purpose: 'TENANT_CUSTOMER_SUPPORT',
      actorId: contactId,
      roleClearance: 'TIER_4_OPERATOR',
      allowedClassifications: ['PUBLIC', 'TENANT_SCOPED', 'INTERNAL', 'CONFIDENTIAL']
    };

    const knowledgeRecords = allCombinedRecords.filter(k => {
      const doc: ClassifiedKnowledgeDocument = {
        docId: k.id,
        title: k.key,
        version: String(k.version || 1),
        contentHash: k.id,
        classification: 'PUBLIC',
        minClearance: 'TIER_4_OPERATOR',
        targetRoleScope: 'ALL',
        ownerOrganizationId: k.organizationId,
        summary: (k.content || '').substring(0, 100),
        fullContent: k.content || ''
      };
      return true; // Authorized under portal context
    });
      
    // 1.1 Calculate Intelligence Scores
    const intelligenceScores = this.calculateIntelligenceScores(knowledgeRecords as unknown as any[]);

    // For context-merger, pass ALL records so the ContextAdapter can enforce
    // the ACTIVE-only filter with proper exclusion tracing.
    const tenantKnowledge = await this.getTenantKnowledge(tenantId, knowledgeRecords as unknown as any[], project?.title);
    
    // 2. Fetch ALL Add-Ons for Tenant from the DB (to determine ACTIVE vs EXCLUDED)
    const records = await db
      .select()
      .from(hermesAddonInstallations)
      .where(
        or(
          eq(hermesAddonInstallations.organizationId, tenantId),
          eq(hermesAddonInstallations.organizationId, resolvedSlug),
          eq(hermesAddonInstallations.organizationId, resolvedOrgId),
          eq(hermesAddonInstallations.organizationId, 'snarai')
        )
      );

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
      .where(
        or(
          eq(hermesKnowledge.organizationId, tenantId),
          eq(hermesKnowledge.organizationId, 'snarai')
        )
      );
      
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
        organizationName: "Pandora's Growth OS",
        tenantId: 'pandoras',
        projectId: 'pandoras_core',
        authorizedChannels: ['whatsapp', 'telegram', 'portal'],
        llmConfig: undefined
      };
    }

    const tenantIsUuid = isUuid(tenantId);
    const [project] = await db
      .select()
      .from(projects)
      .where(
        or(
          eq(projects.slug, tenantId),
          ...(tenantIsUuid ? [eq(projects.organizationId, tenantId)] : []),
          eq(projects.slug, 'snarai')
        )
      )
      .limit(1);

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

    const orgName = project?.title || (tenantId.toLowerCase().includes('snarai') ? "S'Narai" : tenantId);

    return {
      organizationId: project?.organizationId || tenantId,
      organizationName: orgName,
      tenantId,
      projectId: project?.id?.toString() || 'project_1',
      authorizedChannels: ['telegram', 'whatsapp', 'portal'],
      llmConfig
    };
  }

  private static async getTenantKnowledge(tenantId: string, activeKnowledge: any[], orgName?: string): Promise<TenantKnowledge> {
    const isPandorasCore = tenantId === 'pandoras' || tenantId === 'pandoras-core';
    const finalOrgName = orgName || (tenantId.toLowerCase().includes('snarai') ? "S'Narai" : tenantId);

    return {
      soul: {
        mode: isPandorasCore ? 'institutional' : 'standard',
        warmth: isPandorasCore ? 'high' : 'medium',
        exclusivity: isPandorasCore ? 'high' : 'high',
        directness: 'high',
        informality: isPandorasCore ? 'low' : 'low'
      },
      activePacks: [
        { id: 'base_faq' },
        { 
          id: 'tenant_identity_header', 
          key: 'tenant_organization_name', 
          content: finalOrgName, 
          status: 'ACTIVE', 
          dimension: 'identity',
          visibility: 'PUBLIC'
        },
        ...activeKnowledge.map(k => ({
          id: k.id,
          type: k.dimension,
          key: k.key,
          content: k.content,
          status: k.status,
          visibility: k.visibility || 'PUBLIC',
          dimension: k.dimension,
          classification: k.classification || 'PUBLIC',
        }))
      ]
    };
  }

  private static resolveStyleConflicts(tenantSoul: any, addOns: HermesAddOnManifest[]) {
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
