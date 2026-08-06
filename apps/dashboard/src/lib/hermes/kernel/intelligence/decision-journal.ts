import { CapabilityBinding, ExecutionRequest, ExecutionResult, ServiceProvider } from '../../contracts/universal';
import { db } from '@/db';
import { hermesJournal } from '@/db/schema';

/**
 * 🧠 Intelligence Engine — Decision Journal
 * 
 * ADR-008: The journal is the immutable log of the Execution Graph.
 * Fully backed by PostgreSQL (hermesJournal) for long-term audibility.
 */
export class DecisionJournal {
  public static async logDecision(
    request: ExecutionRequest,
    binding: CapabilityBinding | undefined,
    provider: ServiceProvider,
    result: ExecutionResult
  ): Promise<void> {
    const entry = {
      requestId: request.requestId,
      tenantId: request.tenantId || 'system',
      capability: request.capability,
      executionStatus: result.status,
      artifactsGenerated: result.artifacts?.length || 0,
      resolvedBinding: binding ? binding : null,
      resolvedProvider: provider,
    };

    await db.insert(hermesJournal).values(entry);
    console.log(`[DecisionJournal] Logged execution for ${request.capability} -> ${provider.id} [${result.status}]`);
  }
}
