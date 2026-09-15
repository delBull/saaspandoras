import { db } from '@/db';
import { eq, and, gt, like, or, isNull } from 'drizzle-orm';
import { nexusActionRequests } from '@/db/schema';
import { DomainAdapter, NexusOperation } from './DomainAdapter';
import { NexusAuthContext, checkNexusPermission } from '@/lib/nexus/nexus-rbac';

export class TreasuryAdapter implements DomainAdapter {
  async getOperations(authCtx: NexusAuthContext): Promise<NexusOperation[]> {
    // 1. Resource Scope
    if (!authCtx.canonicalOrgId) return [];

    // 2. Capability Scope
    if (!checkNexusPermission(authCtx, 'finance.manage')) {
      return [];
    }

    const now = new Date();
    
    // 3. Assignment & Extraction
    const requests = await db.select()
      .from(nexusActionRequests)
      .where(
        and(
          eq(nexusActionRequests.status, 'PENDING'),
          like(nexusActionRequests.actionType, '%DEPOSIT%'),
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
        type: 'DECISION',
        priority: 'HIGH',
        domain: 'TREASURY',
        title: `Approve Deposit: ${payload?.fiatAmount || 'Unknown amount'}`,
        description: `Method: ${payload?.method || 'Transfer'} • Resource: ${req.targetResource}`,
        status: req.status,
        requiredCapability: req.requiredCapability,
        assigneeId: req.actorIdentityId,
        visibility: req.actorIdentityId ? 'ASSIGNED' : 'TEAM',
        createdAt: req.createdAt,
        expiresAt: req.expiresAt,
        actions: [
          { label: 'Approve', action: 'APPROVE', intent: 'primary' },
          { label: 'Reject', action: 'REJECT', intent: 'danger' },
          { label: 'Defer', action: 'DEFER', intent: 'secondary' }
        ],
        payload: {
          ...req.payload as object,
          actionRequestId: req.id
        }
      };
    });
  }
}
