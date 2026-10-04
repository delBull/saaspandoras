import { GrowthReadAdapter, ResourceScope } from './growth-read-adapter';

export interface GrowthContext {
  pipelineState: Record<string, any>;
  leadState: Record<string, any>;
  nextBestAction: {
    recommendedAction: string;
    reason: string;
  };
}

export class GrowthIntelligenceEngine {
  /**
   * Generates the Growth-specific intelligence context using authorized Read Adapters.
   * Hermes Runtime is responsible for resolving capabilities and passing the authorized ResourceScope.
   */
  static async buildContext(
    scope: ResourceScope,
    capabilities: string[]
  ): Promise<GrowthContext> {
    
    const context: GrowthContext = {
      pipelineState: {},
      leadState: {},
      nextBestAction: {
        recommendedAction: 'NONE',
        reason: 'No action needed',
      }
    };

    // If the authorized identity doesn't have read capabilities, return empty facts
    if (!capabilities.includes('growth.leads.read')) {
      context.leadState = {
        status: 'UNAUTHORIZED',
        classification: 'UNKNOWN',
        reason: 'Missing growth.leads.read capability'
      };
      return context;
    }

    const metrics = await GrowthReadAdapter.getLeadMetrics(scope);

    if (metrics.status !== 'SUCCESS' || !metrics.data) {
      context.leadState = {
        status: metrics.status,
        classification: 'UNKNOWN',
        reason: metrics.reason || 'Failed to read metrics from adapter'
      };
      return context;
    }

    // Map DB results to semantic Facts
    context.leadState = {
      total: {
        value: metrics.data.totalLeads,
        classification: 'FACT',
        source: 'marketing_leads'
      },
      new: {
        value: metrics.data.newLeads,
        classification: 'FACT',
        source: 'marketing_leads'
      },
      active: {
        value: metrics.data.activeLeads,
        classification: 'FACT',
        source: 'marketing_leads'
      }
    };

    // Derive Next Best Action based on actual DB facts
    if (metrics.data.newLeads > 0) {
      context.nextBestAction = {
        recommendedAction: 'FOLLOW_UP_LEAD',
        reason: `Hay ${metrics.data.newLeads} leads nuevos (FACT).`,
      };
    } else if (metrics.data.activeLeads > 0) {
      context.nextBestAction = {
        recommendedAction: 'NURTURE_LEAD',
        reason: `Hay ${metrics.data.activeLeads} leads activos. Mantener seguimiento.`,
      };
    }

    return context;
  }

  static formatKnowledgeSummary(context: GrowthContext): { id: string, key: string, content: string, status: string, visibility: string, dimension: string, classification: string }[] {
    return [{
      id: 'growth_intelligence_summary',
      key: 'growth_intelligence',
      content: `Leads: ${JSON.stringify(context.leadState)}. Pipeline: ${JSON.stringify(context.pipelineState)}. Next Best Action: ${context.nextBestAction.recommendedAction} (${context.nextBestAction.reason})`,
      status: 'ACTIVE',
      visibility: 'INTERNAL_OPERATIONAL',
      dimension: 'strategy',
      classification: 'TENANT_RESTRICTED'
    }];
  }
}
