import { HermesAddOnManifest } from './contracts';
import { db } from '@/db';
import { hermesAddonInstallations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface CoreSecurityContext {
  organizationId: string;
  tenantId: string;
  projectId: string;
  authorizedChannels: string[];
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

export interface ConversationContext {
  core: CoreSecurityContext;
  knowledge: any[];
  style: any;
  activeCapabilities: any[];
  diagnostics?: {
    activeAddOns: string[];
    excludedAddOns: { id: string; status: string }[];
  };
}

export class CognitiveContextBuilder {
  static async buildEffectiveContext(tenantId: string, contactId: string): Promise<ConversationContext> {
    const coreContext = await this.buildCoreSecurityContext(tenantId);
    const tenantKnowledge = await this.getTenantKnowledge(tenantId);
    
    // 1. Fetch ALL Add-Ons for Tenant from the DB (to determine ACTIVE vs EXCLUDED)
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

    // 2. Resolve Overlays
    const styleOverlay = this.resolveStyleConflicts(tenantKnowledge.soul, activeAddOns);
    const knowledgeOverlay = this.resolveKnowledgeConflicts(tenantKnowledge, activeAddOns);
    
    // 3. Build Effective Runtime
    return {
      core: coreContext,
      knowledge: [...tenantKnowledge.activePacks, ...knowledgeOverlay],
      style: styleOverlay,
      activeCapabilities: activeAddOns.flatMap(a => a.capabilities || []),
      diagnostics: {
        activeAddOns: activeRecords.map(r => r.addonId),
        excludedAddOns: excludedRecords.map(r => ({ id: r.addonId, status: r.status }))
      }
    };
  }

  private static async buildCoreSecurityContext(tenantId: string): Promise<CoreSecurityContext> {
    return {
      organizationId: 'pandoras',
      tenantId,
      projectId: 'project_1',
      authorizedChannels: ['telegram'] // Baseline tenant channel
    };
  }

  private static async getTenantKnowledge(tenantId: string): Promise<TenantKnowledge> {
    return {
      soul: {
        mode: 'standard',
        warmth: 'medium',
        exclusivity: 'low',
        directness: 'high',
        informality: 'high'
      },
      activePacks: [{ id: 'base_faq' }]
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
