export interface HermesSurfaceDefinition {
  surface: string;
  capabilities: string[];
  knowledgeScopes: string[];
  allowedActions: string[];
  prohibitedActions: string[];
  policies: string[];
  handoffTargets: string[];
}

export const ONBOARDING_SURFACE: HermesSurfaceDefinition = {
  surface: 'ONBOARDING',
  capabilities: ['onboarding.view', 'onboarding.guide', 'onboarding.assess', 'onboarding.recommend'],
  knowledgeScopes: ['platform.overview', 'tenant.state', 'product.features'],
  allowedActions: ['PROPOSE_ACTION', 'REQUEST_ESCALATION', 'PROPOSE_HANDOFF'],
  prohibitedActions: ['EXECUTE_ACTION', 'APPROVE_PROPOSAL', 'MODIFY_DB'],
  policies: ['STRICT_PROPOSE_ONLY', 'READ_ONLY_STATE', 'NO_EXECUTION'],
  handoffTargets: ['GROWTH_OS', 'TREASURY', 'ACADEMY', 'GOVERNANCE', 'DEMAND_DISTRIBUTION'],
};
