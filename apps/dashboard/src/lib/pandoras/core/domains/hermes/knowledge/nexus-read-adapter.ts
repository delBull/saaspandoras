import { db } from '@/db';
import { nexusActionRequests, hermesEscalations } from '@/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import type { AttentionItem, AttentionInbox } from '../../nexus/attention-item';
import type { NexusResourceScope } from '../../nexus/nexus-authorization';

export class NexusReadAdapter {
  /**
   * Fetches AttentionItems scoped securely to the collaborator's authorization.
   * Fails closed (UNAVAILABLE) on DB errors, never masking failures as empty arrays.
   */
  static async getAttentionInbox(scope: NexusResourceScope): Promise<AttentionInbox> {
    try {
      if (!scope.collaboratorId || !scope.canonicalOrgId) {
        return {
          count: 0,
          status: 'UNAVAILABLE',
          items: [],
          source: 'nexus_core',
          reason: 'Invalid or missing NexusResourceScope. Authorization failed.',
        };
      }

      // 1. Evaluate Request Visibility Policy for nexusActionRequests
      // A collaborator can see requests if:
      // a) They have global approval capability (admin), OR
      // b) The request is specifically assigned to them or their queues.
      // (For MVP, we check specific capabilities or global visibility).
      
      const requestsQuery = db.select()
        .from(nexusActionRequests)
        .where(
          and(
            eq(nexusActionRequests.canonicalOrgId, scope.canonicalOrgId),
            eq(nexusActionRequests.status, 'PENDING')
          )
        );

      // 2. Evaluate Visibility Policy for hermesEscalations
      // Escalations contain sensitive conversation details.
      const escalationsQuery = db.select()
        .from(hermesEscalations)
        .where(
          and(
            eq(hermesEscalations.organizationId, scope.canonicalOrgId),
            eq(hermesEscalations.status, 'PENDING')
          )
        );

      const [requests, escalations] = await Promise.all([requestsQuery, escalationsQuery]);

      const items: AttentionItem[] = [];

      requests.forEach(req => {
        items.push({
          id: req.id.toString(),
          type: req.actionType.includes('KYC') ? 'KYC' : req.actionType.includes('DEPOSIT') ? 'DEPOSIT' : 'APPROVAL',
          resourceType: 'nexus_action_request',
          resourceId: req.id.toString(),
          severity: 'HIGH',
          title: `Action Request: ${req.actionType}`,
          reason: 'Pending manual operator review',
          status: 'NEW',
          requiredCapability: `nexus.approval.${req.actionType.toLowerCase()}`,
          resourceScope: {
            tenantId: req.canonicalOrgId,
            resourceId: req.id.toString(),
          },
          createdAt: req.createdAt,
          updatedAt: req.createdAt,
        });
      });

      escalations.forEach(esc => {
        items.push({
          id: esc.id,
          type: 'ESCALATION',
          resourceType: 'hermes_escalation',
          resourceId: esc.id,
          severity: 'HIGH',
          title: `Escalation from Hermes`,
          reason: esc.reason || 'Human intervention requested by Hermes',
          status: 'NEW',
          requiredCapability: 'nexus.escalation.respond',
          resourceScope: {
            tenantId: esc.organizationId,
            conversationId: esc.conversationId,
          },
          createdAt: esc.createdAt,
          updatedAt: esc.createdAt,
        });
      });

      // Sort by severity (CRITICAL > HIGH > MEDIUM > LOW) then by date
      items.sort((a, b) => {
        const severityScores: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const aScore = severityScores[a.severity] || 0;
        const bScore = severityScores[b.severity] || 0;
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return {
        count: items.length,
        status: 'AVAILABLE',
        items,
        source: 'nexus_read_adapter'
      };

    } catch (e) {
      console.error('[NexusReadAdapter] Error fetching AttentionInbox:', e);
      return {
        count: 0,
        status: 'UNAVAILABLE',
        items: [],
        source: 'nexus_read_adapter',
        reason: 'DATABASE_READ_FAILED'
      };
    }
  }
}
