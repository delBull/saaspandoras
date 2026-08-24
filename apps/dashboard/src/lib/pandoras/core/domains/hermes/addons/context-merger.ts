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
import { TenantIpfsVaultService } from '../knowledge/ipfs-vault';
import { ClaimContractEngine } from '../knowledge/claim-contract-engine';

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
  /** K27.1 Invariant: True when registered sovereign claim contracts failed retrieval from IPFS */
  knowledgeUnavailable?: boolean;
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

    const ipfsVault = new TenantIpfsVaultService();
    const mappedIpfsKnowledge: Array<{
      id: string;
      organizationId: string;
      dimension: string;
      key: string;
      content: string;
      status: string;
      visibility: string;
      classification: string;
      version: number;
    }> = [];

    for (const r of ipfsRecords) {
      if (
        r.governanceStatus !== 'ACTIVE' ||
        (r.classification !== 'PUBLIC' && r.classification !== 'TENANT_RESTRICTED')
      ) {
        continue;
      }

      let decryptedContent: string | null = null;

      try {
        decryptedContent = await ipfsVault.retrieveAndDecryptFromIpfs(r.ipfsCid, {
          tenantId: r.tenantId,
          artifactId: r.artifactId,
          version: r.version,
          classification: (r.classification || 'PUBLIC') as any,
        });

        const computedHash = crypto.createHash('sha256').update(decryptedContent, 'utf8').digest('hex');
        if (computedHash !== r.contentHash) {
          console.warn(`[ContextMerger] 🚨 KNOWLEDGE_INTEGRITY_MISMATCH: ${r.artifactId}. Failing closed.`);
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
              action: 'FAIL_CLOSED_EXCLUSION',
            },
          }).catch(err => console.error('[ContextMerger] Failed to record audit:', err));
          decryptedContent = null;
        }
      } catch (err: any) {
        // Fallback fail-closed: exclude pack if IPFS retrieval fails, never fall back to plaintext
        console.warn(`[ContextMerger] 🚨 IPFS_FETCH_FAILED for "${r.artifactId}":`, err?.message);
        SecurityAuditLogger.logEvent({
          organizationId: r.tenantId,
          eventType: 'RESOURCE_MISMATCH_BLOCKED',
          severity: 'WARN',
          policyDecision: 'DENY',
          correlationId: `ipfs_fail_${Date.now()}`,
          artifactId: r.artifactId,
          metadata: {
            reason: 'IPFS_FETCH_FAILED',
            ipfsCid: r.ipfsCid,
            error: err?.message,
            action: 'FAIL_CLOSED_EXCLUSION',
          },
        }).catch(e => console.error('[ContextMerger] Failed to record audit:', e));
        decryptedContent = null;
      }

      if (decryptedContent) {
        mappedIpfsKnowledge.push({
          id: `ipfs_${r.id}`,
          organizationId: r.tenantId,
          dimension: 'IPFS_SOVEREIGN_VAULT',
          key: `${r.domain || 'DOCUMENT'}: ${r.artifactId}`,
          content: `[IPFS Sovereign Verified: ${r.ipfsCid}]\n${decryptedContent}`,
          status: 'ACTIVE',
          visibility: 'PUBLIC',
          classification: r.classification || 'PUBLIC',
          version: r.version,
        });
      }
    }

    // Pure sovereign knowledge: if IPFS records exist, prioritize verified IPFS payloads
    const unpurgedRecords = rawRecords.filter(r => r.content !== null && r.content !== undefined);
    const hasSovereignRegistry = ipfsRecords.length > 0;

    const knowledgeRecords = mappedIpfsKnowledge.length > 0 
      ? mappedIpfsKnowledge 
      : unpurgedRecords;
      
    // 1.1 Calculate Intelligence Scores
    const intelligenceScores = this.calculateIntelligenceScores(knowledgeRecords as unknown as any[]);

    // For context-merger, pass ALL records so the ContextAdapter can enforce
    // the ACTIVE-only filter with proper exclusion tracing.
    const tenantKnowledge = await this.getTenantKnowledge(tenantId, knowledgeRecords as unknown as any[], project?.title);

    const hasActiveContract = Boolean(
      ClaimContractEngine.getContract(tenantId) || 
      ClaimContractEngine.getContract(cleanSlug) ||
      ClaimContractEngine.getContract(resolvedSlug)
    );

    const isKnowledgeUnavailable = Boolean(
      hasSovereignRegistry && 
      mappedIpfsKnowledge.length === 0 && 
      unpurgedRecords.length === 0 && 
      tenantKnowledge.activePacks.length === 0 && 
      !hasActiveContract
    );
    
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
    const allCapabilities = activeAddOns.flatMap(a =>
      (a.capabilities || []).map(cap => ({
        ...cap,
        requiresHumanApproval: a.governanceRequirements?.requiresHumanApproval ?? false,
      }))
    );

    return {
      core: coreContext,
      knowledge: [...tenantKnowledge.activePacks, ...knowledgeOverlay],
      style: styleOverlay,
      activeCapabilities: allCapabilities,
      intelligenceScores,
      knowledgeUnavailable: isKnowledgeUnavailable,
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
    let effectiveStyle: Record<string, any> = { ...(tenantSoul || {}) };

    // Collect all active modes and traits
    const activeModes: string[] = [];
    let highestWarmth: string | null = null;
    let highestExclusivity: string | null = null;
    let lowestPressure: string | null = null;
    let highestDirectness: string | null = null;

    for (const addon of addOns) {
      if (addon.styleOverlay) {
        effectiveStyle = {
          ...effectiveStyle,
          ...addon.styleOverlay,
        };

        if (addon.styleOverlay.mode && !activeModes.includes(addon.styleOverlay.mode)) {
          activeModes.push(addon.styleOverlay.mode);
        }
        if (addon.styleOverlay.warmth === 'high') highestWarmth = 'high';
        if (addon.styleOverlay.exclusivity === 'ultra') highestExclusivity = 'ultra';
        else if (addon.styleOverlay.exclusivity === 'high' && highestExclusivity !== 'ultra') highestExclusivity = 'high';

        if (addon.styleOverlay.pressure === 'none') lowestPressure = 'none';
        else if (addon.styleOverlay.pressure === 'low' && lowestPressure !== 'none') lowestPressure = 'low';

        if (addon.styleOverlay.directness === 'high') highestDirectness = 'high';
      }
    }

    // Synthesize descriptive communication tone composed across all active modes
    const modeLabels: Record<string, string> = {
      institutional_concierge: 'Concierge Patrimonial Institucional VIP',
      family_office_advisor: 'Asesor Patrimonial Especializado (Family Office & Sindicación)',
      trusted_advisor: 'Asesor de Confianza & Educación Patrimonial',
    };

    const toneDescriptors: string[] = [];
    if (activeModes.length > 0) {
      const renderedModes = activeModes.map(m => modeLabels[m] || m).join(' & ');
      toneDescriptors.push(renderedModes);
    } else if (effectiveStyle.mode) {
      toneDescriptors.push(modeLabels[effectiveStyle.mode] || effectiveStyle.mode);
    }

    const warmth = highestWarmth || effectiveStyle.warmth;
    if (warmth === 'high') toneDescriptors.push('calidez alta y empática');

    const exclusivity = highestExclusivity || effectiveStyle.exclusivity;
    if (exclusivity === 'ultra') toneDescriptors.push('máximo nivel de exclusividad y discreción fiduciaria');
    else if (exclusivity === 'high') toneDescriptors.push('alto nivel de exclusividad y discreción');

    const pressure = lowestPressure || effectiveStyle.pressure;
    if (pressure === 'none' || pressure === 'low') toneDescriptors.push('sin presión comercial');

    const directness = highestDirectness || effectiveStyle.directness;
    if (directness === 'high') toneDescriptors.push('comunicación directa y transparente');

    if (toneDescriptors.length > 0) {
      effectiveStyle.tone = toneDescriptors.join(', ');
    }

    return effectiveStyle;
  }

  private static resolveKnowledgeConflicts(tenantKnowledge: any, addOns: HermesAddOnManifest[]) {
    return addOns.flatMap(a => a.knowledgeOverlays || []);
  }
}

export { CognitiveContextBuilder as ContextMerger };
