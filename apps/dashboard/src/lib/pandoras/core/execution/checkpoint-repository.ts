import { db } from '../../../../db';
import { hermesExecutionCheckpoints, HermesExecutionCheckpoint } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export interface SaveCheckpointParams {
  organizationId: string;
  sessionId: string;
  actorId: string;
  currentStageId: string;
  statePayload: any;
  operationalIntentId?: string;
  status?: "PENDING_APPROVAL" | "RESUMED" | "CANCELLED" | "EXPIRED";
  expiresAt: Date;
}

export class CheckpointRepository {
  public async save(params: SaveCheckpointParams): Promise<string> {
    const jsonPayload = JSON.stringify(params.statePayload);
    const hash = crypto.createHash('sha256').update(jsonPayload).digest('hex');

    const [inserted] = await db.insert(hermesExecutionCheckpoints).values({
      organizationId: params.organizationId,
      sessionId: params.sessionId,
      actorId: params.actorId,
      currentStageId: params.currentStageId,
      statePayload: params.statePayload,
      operationalIntentId: params.operationalIntentId || null,
      status: params.status || 'PENDING_APPROVAL',
      stateIntegrityHash: hash,
      expiresAt: params.expiresAt,
    }).returning({ id: hermesExecutionCheckpoints.id });

    if (!inserted) throw new Error("Failed to insert checkpoint");
    return inserted.id;
  }

  public async findBySessionAndOrg(sessionId: string, organizationId: string): Promise<HermesExecutionCheckpoint | undefined> {
    const results = await db.select()
      .from(hermesExecutionCheckpoints)
      .where(
        and(
          eq(hermesExecutionCheckpoints.sessionId, sessionId),
          eq(hermesExecutionCheckpoints.organizationId, organizationId)
        )
      )
      .orderBy(hermesExecutionCheckpoints.createdAt)
      .limit(1);

    return results[0];
  }

  public async findById(id: string): Promise<HermesExecutionCheckpoint | undefined> {
    const results = await db.select()
      .from(hermesExecutionCheckpoints)
      .where(eq(hermesExecutionCheckpoints.id, id))
      .limit(1);
    
    return results[0];
  }

  public async markResumed(id: string): Promise<void> {
    await db.update(hermesExecutionCheckpoints)
      .set({ 
        status: 'RESUMED', 
        resumedAt: new Date() 
      })
      .where(eq(hermesExecutionCheckpoints.id, id));
  }

  public async markCancelled(id: string): Promise<void> {
    await db.update(hermesExecutionCheckpoints)
      .set({ 
        status: 'CANCELLED', 
        cancelledAt: new Date() 
      })
      .where(eq(hermesExecutionCheckpoints.id, id));
  }
}
