/**
 * Adaptador Drizzle de solicitudes de reasignación (P0.1/P0.2).
 *
 * ⚠️ ESTADO: IMPLEMENTADO — NO VERIFICADO.
 * Depende de `crm_reassignment_requests` (migración 0097, no aplicada).
 */

import { and, eq } from '@saasfly/db-core';
import { db } from '@saasfly/db';
import { crmReassignmentRequests } from '@saasfly/db/schema';
import type { ApprovalStatus, ReassignmentRequest, ReassignmentRequestStore } from './team-membership';

function epoch(value: Date | null | undefined): number | null {
  return value ? Math.floor(value.getTime() / 1000) : null;
}

export class DrizzleReassignmentRequestStore implements ReassignmentRequestStore {
  async create(request: ReassignmentRequest): Promise<void> {
    await db.insert(crmReassignmentRequests).values({
      id: request.id,
      organizationId: request.organizationId,
      opportunityId: request.opportunityId,
      ownerFrom: request.ownerFrom,
      ownerTo: request.ownerTo,
      requestedBy: request.requestedBy,
      reason: request.reason,
      status: request.status,
      createdAt: new Date(request.createdAt * 1000),
    });
  }

  async get(id: string): Promise<ReassignmentRequest | null> {
    const [row] = await db
      .select()
      .from(crmReassignmentRequests)
      .where(eq(crmReassignmentRequests.id, id))
      .limit(1);

    if (!row) return null;
    return {
      id: row.id,
      organizationId: row.organizationId,
      opportunityId: row.opportunityId,
      ownerFrom: row.ownerFrom,
      ownerTo: row.ownerTo,
      requestedBy: row.requestedBy,
      reason: row.reason ?? null,
      status: row.status as ApprovalStatus,
      decidedBy: row.decidedBy ?? null,
      decidedAt: epoch(row.decidedAt),
      decisionNote: row.decisionNote ?? null,
      createdAt: epoch(row.createdAt) ?? 0,
    };
  }

  async transition(
    id: string,
    from: ApprovalStatus,
    to: ApprovalStatus,
    patch: Partial<ReassignmentRequest>,
  ): Promise<boolean> {
    const updated = await db
      .update(crmReassignmentRequests)
      .set({
        status: to,
        ...(patch.decidedBy !== undefined ? { decidedBy: patch.decidedBy } : {}),
        ...(patch.decidedAt !== undefined
          ? { decidedAt: patch.decidedAt ? new Date(patch.decidedAt * 1000) : null }
          : {}),
        ...(patch.decisionNote !== undefined ? { decisionNote: patch.decisionNote } : {}),
      })
      .where(and(eq(crmReassignmentRequests.id, id), eq(crmReassignmentRequests.status, from)))
      .returning({ id: crmReassignmentRequests.id });

    return updated.length > 0;
  }
}
