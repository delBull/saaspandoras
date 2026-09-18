export interface IntelligenceProvider {
  buildContext(scope: any, capabilities: string[]): Promise<any>;
  formatKnowledgeSummary(context: any): { id: string, key: string, content: string, status: string, visibility: string, dimension: string, classification: string }[];
}

export interface HermesSurfaceDefinition {
  surface: string;
  capabilities: string[];
  knowledgeScopes: string[];
  allowedActions: string[];
  prohibitedActions: string[];
  policies: string[];
  handoffTargets: string[];
  resourceScopes: string[]; // Added resourceScopes
  getIntelligenceProvider?: () => Promise<IntelligenceProvider>;
}

export const ONBOARDING_SURFACE: HermesSurfaceDefinition = {
  surface: 'ONBOARDING',
  capabilities: ['onboarding.view', 'onboarding.guide', 'onboarding.assess', 'onboarding.recommend'],
  knowledgeScopes: ['platform.overview', 'tenant.state', 'product.features'],
  allowedActions: ['PROPOSE_ACTION', 'REQUEST_ESCALATION', 'PROPOSE_HANDOFF'],
  prohibitedActions: ['EXECUTE_ACTION', 'APPROVE_PROPOSAL', 'MODIFY_DB'],
  policies: ['STRICT_PROPOSE_ONLY', 'READ_ONLY_STATE', 'NO_EXECUTION'],
  handoffTargets: ['GROWTH_OS', 'TREASURY', 'ACADEMY', 'GOVERNANCE', 'DEMAND_DISTRIBUTION'],
  resourceScopes: ['tenant.org_id'],
};

export const GROWTH_OS_SURFACE: HermesSurfaceDefinition = {
  surface: 'GROWTH_OS',
  capabilities: ['growth.leads.read', 'growth.leads.manage', 'growth.analytics.read', 'growth.campaigns.plan', 'growth.campaigns.approve', 'growth.campaigns.distribute'],
  knowledgeScopes: ['tenant.leads', 'tenant.campaigns', 'tenant.pipeline', 'tenant.opportunities'],
  allowedActions: ['READ', 'PROPOSE', 'PROPOSE_HANDOFF'],
  prohibitedActions: ['GLOBAL_EXECUTE', 'DELETE_RECORDS'],
  policies: ['RBAC_CAPABILITY_CHECK', 'AUTHORIZE_BEFORE_EXECUTE', 'CROSS_TENANT_ISOLATION'],
  handoffTargets: ['TREASURY', 'ACADEMY', 'SUPPORT'],
  resourceScopes: ['tenant.org_id'],
  getIntelligenceProvider: async () => {
    const { GrowthIntelligenceEngine } = await import('./../knowledge/growth-intelligence');
    return GrowthIntelligenceEngine;
  }
};

export const PORTAL_CLIENT_CONCIERGE_SURFACE: HermesSurfaceDefinition = {
  surface: 'PORTAL_CLIENT_CONCIERGE',
  capabilities: ['portal.view', 'portal.explain', 'portal.guide', 'portal.propose_meeting'],
  knowledgeScopes: ['project.public', 'project.client', 'own.holdings'],
  allowedActions: ['READ', 'PROPOSE'],
  prohibitedActions: ['EXECUTE_ACTION', 'MODIFY_HOLDINGS', 'VIEW_OTHER_CLIENTS'],
  policies: ['STRICT_PROPOSE_ONLY', 'FACT_BASED_HOLDINGS_ONLY', 'NO_EXECUTION'],
  handoffTargets: ['PORTAL_AMBASSADOR_OPERATOR', 'SUPPORT'],
  resourceScopes: ['tenant.org_id', 'project.id', 'user.wallet', 'own.holdings'],
  getIntelligenceProvider: async () => {
    const { PortalIntelligenceEngine } = await import('./../knowledge/portal-intelligence');
    return PortalIntelligenceEngine;
  }
};

export const PORTAL_AMBASSADOR_OPERATOR_SURFACE: HermesSurfaceDefinition = {
  surface: 'PORTAL_AMBASSADOR_OPERATOR',
  capabilities: ['leads.read', 'leads.manage', 'followup.propose', 'meeting.propose', 'content.request'],
  knowledgeScopes: ['project.public', 'ambassador.playbook', 'assigned.leads', 'authorized.sales'],
  allowedActions: ['READ', 'PROPOSE', 'LOW_RISK_EXECUTE'],
  prohibitedActions: ['EXECUTE_FINANCIAL', 'VIEW_UNASSIGNED_LEADS'],
  policies: ['RBAC_CAPABILITY_CHECK', 'FACT_BASED_HOLDINGS_ONLY'],
  handoffTargets: ['SUPPORT', 'GROWTH_OS'],
  resourceScopes: ['tenant.org_id', 'project.id', 'ambassador.id', 'assigned.leads'],
  getIntelligenceProvider: async () => {
    const { PortalIntelligenceEngine } = await import('./../knowledge/portal-intelligence');
    return PortalIntelligenceEngine;
  }
};

export const NEXUS_OPERATOR_SURFACE: HermesSurfaceDefinition = {
  surface: 'NEXUS_OPERATOR',
  capabilities: ['nexus.approval.*', 'nexus.escalation.*'], // Families of capabilities
  knowledgeScopes: ['nexus.inbox', 'nexus.team', 'nexus.activity'],
  allowedActions: ['READ', 'PROPOSE', 'EXPLAIN'], // Eliminated NEXUS_DISPATCH
  prohibitedActions: ['EXECUTE_UNAUTHORIZED', 'VIEW_UNASSIGNED_QUEUES'],
  policies: ['STRICT_PROPOSE_ONLY', 'NEXUS_RBAC_CHECK', 'AUTHORIZE_BEFORE_EXECUTE'],
  handoffTargets: ['SUPPORT'],
  resourceScopes: ['collaborator.id', 'collaborator.permissions', 'assigned.queues'],
  getIntelligenceProvider: async () => {
    const { NexusIntelligenceEngine } = await import('./../knowledge/nexus-intelligence');
    return NexusIntelligenceEngine;
  }
};

export class SurfaceRegistry {
  private static surfaces: Record<string, HermesSurfaceDefinition> = {
    'ONBOARDING': ONBOARDING_SURFACE,
    'GROWTH_OS': GROWTH_OS_SURFACE,
    'PORTAL_CLIENT_CONCIERGE': PORTAL_CLIENT_CONCIERGE_SURFACE,
    'PORTAL_AMBASSADOR_OPERATOR': PORTAL_AMBASSADOR_OPERATOR_SURFACE,
    'NEXUS_OPERATOR': NEXUS_OPERATOR_SURFACE,
  };

  static getSurface(name: string): HermesSurfaceDefinition {
    const surface = this.surfaces[name];
    if (!surface) {
      throw new Error(`Unknown Hermes Surface: ${name}`);
    }
    return surface;
  }
}
