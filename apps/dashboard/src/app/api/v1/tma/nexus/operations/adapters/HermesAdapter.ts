import { db } from '@/db';
import { eq, and, gt, like, or, isNull } from 'drizzle-orm';
import { nexusActionRequests } from '@/db/schema';
import { DomainAdapter, NexusOperation } from './DomainAdapter';
import { NexusAuthContext, checkNexusPermission } from '@/lib/nexus/nexus-rbac';

export class HermesAdapter implements DomainAdapter {
  async getOperations(authCtx: NexusAuthContext): Promise<NexusOperation[]> {
    if (!authCtx.canonicalOrgId) return [];

    if (!checkNexusPermission(authCtx, 'nexus.manage')) {
      return [];
    }

    const now = new Date();
    
    const requests = await db.select()
      .from(nexusActionRequests)
      .where(
        and(
          eq(nexusActionRequests.status, 'PENDING'),
          like(nexusActionRequests.actionType, '%HERMES%'),
          eq(nexusActionRequests.canonicalOrgId, authCtx.canonicalOrgId),
          gt(nexusActionRequests.expiresAt, now),
          or(
            isNull(nexusActionRequests.actorIdentityId),
            eq(nexusActionRequests.actorIdentityId, authCtx.collaboratorId!)
          )
        )
      );

    return requests.map(req => {
      const payload = req.payload as any;
      return {
        id: req.actionToken,
        type: 'INTERVENTION',
        priority: 'CRITICAL',
        domain: 'HERMES',
        title: `Human Takeover: ${payload?.userName || 'Anonymous User'}`,
        description: `Reason: ${payload?.escalationReason || 'Unknown'}`,
        status: req.status,
        requiredCapability: req.requiredCapability,
        assigneeId: req.actorIdentityId,
        visibility: req.actorIdentityId ? 'ASSIGNED' : 'TEAM',
        createdAt: req.createdAt,
        expiresAt: req.expiresAt,
        actions: [
          { label: 'Takeover Session', action: 'TAKEOVER', intent: 'primary' }
        ],
        payload: req.payload
      };
    });
  }
}
