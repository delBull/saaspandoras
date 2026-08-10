import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { operationalIntents } from '@/db/schema';
import { OperationalIntent } from '../../core/contracts/governance-contracts';
import { TenantScope } from '../../core/domains/control-plane/application/context';
import { OperationalIntentRepository, TransitionResult } from '../../core/ports/repositories/operational-intent-repository.interface';

export class PostgresOperationalIntentRepository implements OperationalIntentRepository {
  
  async create(intent: OperationalIntent): Promise<OperationalIntent> {
    await db.insert(operationalIntents).values({
      id: intent.id,
      organizationId: intent.organizationId,
      missionId: intent.missionId,
      packId: intent.packId,
      packVersion: intent.packVersion,
      strategyDecisionId: intent.strategyDecisionId,
      intentType: intent.intentType,
      objective: intent.objective,
      rationale: intent.rationale,
      constraints: intent.constraints as any,
      approvalPolicy: intent.approvalPolicy as any,
      status: intent.status,
      createdAt: intent.createdAt,
      updatedAt: intent.updatedAt,
    });
    return intent;
  }

  async findById(id: string, scope: TenantScope): Promise<OperationalIntent | null> {
    const rows = await db.select()
      .from(operationalIntents)
      .where(and(
        eq(operationalIntents.id, id),
        eq(operationalIntents.organizationId, scope.organizationId)
      ))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToDomain(rows[0]);
  }

  async findPending(scope: TenantScope): Promise<OperationalIntent[]> {
    const rows = await db.select()
      .from(operationalIntents)
      .where(and(
        eq(operationalIntents.organizationId, scope.organizationId),
        eq(operationalIntents.status, 'pending_approval')
      ));

    return rows.map(row => this.mapToDomain(row));
  }

  async transitionStatus(
    id: string, 
    scope: TenantScope, 
    expectedStatus: OperationalIntent['status'], 
    nextStatus: OperationalIntent['status']
  ): Promise<TransitionResult> {
    
    // ATOMIC MUTATION using state-guarded UPDATE
    const updated = await db.update(operationalIntents)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(and(
        eq(operationalIntents.id, id),
        eq(operationalIntents.organizationId, scope.organizationId),
        eq(operationalIntents.status, expectedStatus)
      ))
      .returning({ id: operationalIntents.id });

    if (updated.length > 0) {
      return { transitioned: true };
    }

    // Rows affected = 0. We must determine WHY the update failed, to honor the contract.
    // We do a tenant-scoped read to check the current state.
    const intentRows = await db.select({ status: operationalIntents.status, orgId: operationalIntents.organizationId })
      .from(operationalIntents)
      .where(eq(operationalIntents.id, id))
      .limit(1);

    if (intentRows.length === 0) {
      return { transitioned: false, reason: 'NOT_FOUND' };
    }

    const row = intentRows[0]!;
    if (row.orgId !== scope.organizationId) {
      return { transitioned: false, reason: 'TENANT_MISMATCH' };
    }

    if (row.status === nextStatus) {
      return { transitioned: false, reason: 'ALREADY_PROCESSED' };
    }

    return { transitioned: false, reason: 'INVALID_STATE' };
  }

  private mapToDomain(row: any): OperationalIntent {
    return {
      id: row.id,
      organizationId: row.organizationId,
      missionId: row.missionId,
      packId: row.packId,
      packVersion: row.packVersion,
      strategyDecisionId: row.strategyDecisionId,
      intentType: row.intentType,
      objective: row.objective,
      rationale: row.rationale,
      constraints: row.constraints as any,
      approvalPolicy: row.approvalPolicy as any,
      status: row.status as OperationalIntent['status'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
