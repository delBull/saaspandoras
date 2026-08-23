import crypto from 'crypto';
import { HermesAddOnManifest } from './contracts';
import { db } from '@/db';
import { hermesAddonInstallations, hermesKnowledge, hermesKnowledgeRegistry, projects, installedProducts } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { KnowledgeDimensionDefinitionRegistry } from '../knowledge/registry';
import { KnowledgeDimension, GovernedKnowledgeItem } from '../knowledge/types';
import { ExecutiveScopeValidator } from '@/lib/pandoras/core/domains/academy/security/scope-validator';
import { RuntimeExecutionContext, ClassifiedKnowledgeDocument } from '@/lib/pandoras/core/domains/academy/security/types';
import { SecurityAuditLogger } from '../runtime/security-audit-logger';

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
    
    // Resolve project identifiers for multi-tenant resilience with org_ normalization
    const cleanSlug = tenantId.replace(/^org_/, '').trim();
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
          eq(projects.slug, cleanSlug),
          eq(projects.slug, tenantId),
          ...(tenantIsUuid ? [eq(projects.organizationId, tenantId)] : []),
          ...(isUuid(cleanSlug) ? [eq(projects.organizationId, cleanSlug)] : [])
        )
      )
      .limit(1);

    const resolvedSlug = project?.slug || cleanSlug;
    const resolvedOrgId = project?.orgId || tenantId;

    // 1. Fetch Tenant Knowledge (ACTIVE) from hermesKnowledge
    const rawRecords = await db
      .select()
      .from(hermesKnowledge)
      .where(
        or(
          eq(hermesKnowledge.organizationId, tenantId),
          eq(hermesKnowledge.organizationId, cleanSlug),
          eq(hermesKnowledge.organizationId, resolvedSlug),
          ...(isUuid(resolvedOrgId) ? [eq(hermesKnowledge.organizationId, resolvedOrgId)] : [])
        )
      );

    // 1b. Fetch Sovereign IPFS knowledge artifacts from hermesKnowledgeRegistry
    const ipfsRecords = await db
      .select()
      .from(hermesKnowledgeRegistry)
      .where(
        or(
          eq(hermesKnowledgeRegistry.tenantId, tenantId),
          eq(hermesKnowledgeRegistry.tenantId, cleanSlug),
          eq(hermesKnowledgeRegistry.tenantId, resolvedSlug),
          ...(isUuid(resolvedOrgId) ? [eq(hermesKnowledgeRegistry.tenantId, resolvedOrgId)] : [])
        )
      );

    const mappedIpfsKnowledge = ipfsRecords
      .filter(r => 
        r.governanceStatus === 'ACTIVE' && 
        (r.classification === 'PUBLIC' || r.classification === 'TENANT_RESTRICTED')
      )
      .map(r => {
        const matchingRaw = rawRecords.find(raw => raw.key === r.artifactId);
        
        let resolvedContent: string;
        if (matchingRaw?.content) {
          const computedHash = crypto.createHash('sha256').update(matchingRaw.content, 'utf8').digest('hex');
          const isCryptographicallyVerified = computedHash === r.contentHash;

          if (!isCryptographicallyVerified) {
            console.warn(
              `[ContextMerger] 🚨 KNOWLEDGE_INTEGRITY_MISMATCH: Artifact "${r.artifactId}" for tenant "${r.tenantId}" in DB plaintext does not match anchored IPFS hash. Degrading to fail-closed pointer.`
            );
            SecurityAuditLogger.logEvent({
              organizationId: r.tenantId,
              eventType: 'RESOURCE_MISMATCH_BLOCKED',
              severity: 'CRITICAL',
              policyDecision: 'DENY',
              correlationId: `integ_${Date.now()}`,
              artifactId: r.artifactId,
              contentHash: computedHash,
              metadata: {
                reason: 'KNOWLEDGE_INTEGRITY_MISMATCH',
                expectedHash: r.contentHash,
                computedHash,
                ipfsCid: r.ipfsCid,
                action: 'FAIL_CLOSED_DEGRADATION',
              },
            }).catch(err => {
              console.error('[ContextMerger] Failed to record security audit event:', err);
            });
          }

          resolvedContent = isCryptographicallyVerified
            ? `[IPFS Sovereign Verified: ${r.ipfsCid}]\n${matchingRaw.content}`
            : `[Sovereign IPFS Document] Artifact: ${r.artifactId} | Domain: ${r.domain} | CID: ${r.ipfsCid} | HASH_MISMATCH`;
        } else {
          resolvedContent = `[Sovereign IPFS Document] Artifact: ${r.artifactId} | Domain: ${r.domain} | CID: ${r.ipfsCid}`;
        }

        return {
          id: `ipfs_${r.id}`,
          organizationId: r.tenantId,
          dimension: 'IPFS_SOVEREIGN_VAULT',
          key: `${r.domain || 'DOCUMENT'}: ${r.artifactId}`,
          content: resolvedContent,
          status: 'ACTIVE',
          visibility: 'PUBLIC',
          classification: r.classification || 'PUBLIC',
          version: r.version,
        };
      });

    const allCombinedRecords = [...rawRecords, ...mappedIpfsKnowledge];

    const knowledgeRecords = allCombinedRecords;
      
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
          eq(hermesAddonInstallations.organizationId, cleanSlug),
          eq(hermesAddonInstallations.organizationId, resolvedSlug),
          ...(isUuid(resolvedOrgId) ? [eq(hermesAddonInstallations.organizationId, resolvedOrgId)] : [])
        )
      );

    const activeRecords = records.filter(r => r.status === 'ACTIVE');
    const excludedRecords = records.filter(r => r.status !== 'ACTIVE');

    // Filter and map active add-ons, ensuring capabilities are populated even if snapshot was minimal
    const activeAddOns = activeRecords.map(r => {
      const snap = (r.manifestSnapshot || {}) as unknown as HermesAddOnManifest;
      if (!snap.capabilities || snap.capabilities.length === 0) {
        const capId = r.addonId.replace(/^hermes\.(capability|channel|composite)\./, '');
        return {
          ...snap,
          id: r.addonId,
          name: snap.name || r.addonId,
          version: snap.version || '1.0.0',
          capabilities: [
            {
              id: capId,
              name: r.addonId,
              description: `Capability for ${r.addonId}`
            }
          ]
        } as unknown as HermesAddOnManifest;
      }
      return snap;
    });

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
    // Canonical tenant resolution (fail-closed): accepts slug, 'org_'-prefixed slug or numeric projectId
    const canonical = tenantId?.replace(/^org_/, '').trim();
    let orgKey = canonical;
    if (canonical && /^\d+$/.test(canonical)) {
      const [proj] = await db
        .select({ slug: projects.slug })
        .from(projects)
        .where(eq(projects.id, Number(canonical)))
        .limit(1);
      if (!proj) return this.calculateIntelligenceScores([]);
      orgKey = proj.slug.replace(/^org_/, '').trim();
    }

    const knowledgeRecords = orgKey
      ? await db.select().from(hermesKnowledge).where(eq(hermesKnowledge.organizationId, orgKey))
      : [];

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

    const cleanSlug = tenantId.replace(/^org_/, '').trim();
    const tenantIsUuid = isUuid(tenantId);
    const [project] = await db
      .select()
      .from(projects)
      .where(
        or(
          eq(projects.slug, cleanSlug),
          eq(projects.slug, tenantId),
          ...(tenantIsUuid ? [eq(projects.organizationId, tenantId)] : []),
          ...(isUuid(cleanSlug) ? [eq(projects.organizationId, cleanSlug)] : [])
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
