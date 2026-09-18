import { PortalReadAdapter, PortalResourceScope } from './portal-read-adapter';

export interface PortalContext {
  holdings: Record<string, any>;
  pipelineState: Record<string, any>;
  nextBestAction: {
    recommendedAction: string;
    reason: string;
  };
}

export class PortalIntelligenceEngine {
  /**
   * Generates the Portal-specific intelligence context for clients and ambassadors.
   * Consumes data via PortalReadAdapter based on strict ResourceScope.
   */
  static async buildContext(
    scope: PortalResourceScope,
    capabilities: string[]
  ): Promise<PortalContext> {
    
    const context: PortalContext = {
      holdings: {},
      pipelineState: {},
      nextBestAction: {
        recommendedAction: 'NONE',
        reason: 'No action needed',
      }
    };

    // 1. Client Holdings Evaluation
    if (capabilities.includes('portal.holdings.read')) {
      const holdingsResult = await PortalReadAdapter.getHoldings(scope);
      
      if (holdingsResult.status !== 'SUCCESS' || !holdingsResult.data) {
        context.holdings = {
          status: holdingsResult.status,
          classification: 'UNKNOWN',
          reason: holdingsResult.reason || 'Failed to read from chain adapter'
        };
      } else {
        context.holdings = {
          value: holdingsResult.data.holdingsCount,
          classification: 'FACT',
          source: 'CHAIN_READ',
          confidence: 'VERIFIED',
          walletChecked: holdingsResult.data.walletAddress,
          contractChecked: holdingsResult.data.contractAddress,
        };

        if (holdingsResult.data.holdingsCount > 0) {
          context.nextBestAction = {
            recommendedAction: 'OFFER_UPSELL',
            reason: 'El cliente ya posee holdings on-chain (FACT VERIFIED).',
          };
        } else {
           context.nextBestAction = {
            recommendedAction: 'GUIDE_PURCHASE',
            reason: 'El cliente no posee holdings on-chain en el deployment autorizado.',
          };
        }
      }
    } else {
      context.holdings = {
        status: 'UNAUTHORIZED',
        classification: 'UNKNOWN',
        reason: 'Missing portal.holdings.read capability'
      };
    }

    // 2. Ambassador Leads Evaluation
    if (capabilities.includes('portal.leads.manage')) {
      const leadsResult = await PortalReadAdapter.getAssignedLeads(scope);
      
      if (leadsResult.status !== 'SUCCESS' || !leadsResult.data) {
        context.pipelineState = {
          status: leadsResult.status,
          classification: 'UNKNOWN',
          reason: leadsResult.reason || 'Failed to read assigned leads from adapter'
        };
      } else {
        context.pipelineState = {
          assigned: {
             value: leadsResult.data.assignedLeadsCount,
             classification: 'FACT',
             source: 'CRM'
          }
        };

        if (leadsResult.data.assignedLeadsCount === 0) {
           // Overwrite NBA with Ambassador logic if they have no leads
           context.nextBestAction = {
            recommendedAction: 'ENCOURAGE_SHARING',
            reason: 'El embajador no tiene leads asignados todavía.',
          };
        }
      }
    }

    return context;
  }

  static formatKnowledgeSummary(context: PortalContext): { id: string, key: string, content: string, status: string, visibility: string, dimension: string, classification: string }[] {
    return [{
      id: 'portal_intelligence_summary',
      key: 'portal_intelligence',
      content: `Holdings: ${JSON.stringify(context.holdings)}. Assigned Leads: ${JSON.stringify(context.pipelineState)}. Next Best Action: ${context.nextBestAction.recommendedAction} (${context.nextBestAction.reason})`,
      status: 'ACTIVE',
      visibility: 'INTERNAL_OPERATIONAL',
      dimension: 'strategy',
      classification: 'TENANT_RESTRICTED'
    }];
  }
}
