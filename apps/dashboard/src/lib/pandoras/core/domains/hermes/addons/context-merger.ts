import { HermesAddOnManifest } from './registry';
import { AddOnInstallationManager } from './installation-manager';

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
}

export class CognitiveContextBuilder {
  static async buildEffectiveContext(tenantId: string, contactId: string): Promise<ConversationContext> {
    const coreContext = await this.buildCoreSecurityContext(tenantId);
    const tenantKnowledge = await this.getTenantKnowledge(tenantId);
    
    // 1. Fetch ACTIVE Add-Ons for Tenant
    const activeAddOns = await AddOnInstallationManager.getActiveAddOns(tenantId);

    // 2. Resolve Overlays
    const styleOverlay = this.resolveStyleConflicts(tenantKnowledge.soul, activeAddOns);
    const knowledgeOverlay = this.resolveKnowledgeConflicts(tenantKnowledge, activeAddOns);
    
    // 3. Build Effective Runtime
    return {
      core: coreContext,
      knowledge: [...tenantKnowledge.activePacks, ...knowledgeOverlay],
      style: styleOverlay,
      activeCapabilities: activeAddOns.flatMap(a => a.capabilities || [])
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
    // We merge the addOn style into the tenant soul, but tenant soul takes precedence
    // if there is a conflict. For this architectural mock, we'll just merge them
    // and let the AddOn's exclusivity override if it's "high".
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
