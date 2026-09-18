import type { IntelligenceProvider } from '../context/surface-definition';
import { NexusReadAdapter } from './nexus-read-adapter';
import type { NexusResourceScope } from '../../nexus/nexus-authorization';

export interface NexusContext {
  inbox: Record<string, any>;
  nextBestAction: {
    recommendedAction: string;
    reason: string;
  };
}

export class NexusIntelligenceEngine {
  /**
   * Generates the Nexus-specific intelligence context for internal collaborators.
   * Consumes data via NexusReadAdapter based on strict ResourceScope.
   */
  static async buildContext(
    scope: NexusResourceScope,
    capabilities: string[]
  ): Promise<NexusContext> {
    
    const context: NexusContext = {
      inbox: {},
      nextBestAction: {
        recommendedAction: 'NONE',
        reason: 'No action needed',
      }
    };

    // 1. Fetch the scoped operational inbox
    const inboxResult = await NexusReadAdapter.getAttentionInbox(scope);
    
    if (inboxResult.status !== 'AVAILABLE' || !inboxResult.items) {
      context.inbox = {
        status: inboxResult.status,
        classification: 'UNKNOWN',
        reason: inboxResult.reason || 'Failed to read from nexus adapter'
      };
    } else {
      context.inbox = {
        value: inboxResult.count,
        classification: 'FACT',
        source: inboxResult.source,
        itemsSummary: inboxResult.items.map((item: any) => ({
          type: item.type,
          severity: item.severity,
          status: item.status,
        }))
      };

      if (inboxResult.count > 0 && inboxResult.items[0]) {
        const topPriority = inboxResult.items[0];
        context.nextBestAction = {
          recommendedAction: `RESOLVE_${topPriority.type}`,
          reason: `There is a ${topPriority.severity} priority ${topPriority.type} requiring attention: ${topPriority.title}.`,
        };
      }
    }

    return context;
  }

  static formatKnowledgeSummary(context: NexusContext): { id: string, key: string, content: string, status: string, visibility: string, dimension: string, classification: string }[] {
    return [{
      id: 'nexus_intelligence_summary',
      key: 'nexus_intelligence',
      content: `Inbox State: ${JSON.stringify(context.inbox)}. Next Best Action: ${context.nextBestAction.recommendedAction} (${context.nextBestAction.reason})`,
      status: 'ACTIVE',
      visibility: 'INTERNAL_OPERATIONAL',
      dimension: 'strategy',
      classification: 'TENANT_RESTRICTED'
    }];
  }
}
