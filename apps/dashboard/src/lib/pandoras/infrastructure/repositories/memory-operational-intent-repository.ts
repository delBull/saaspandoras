import { OperationalIntent } from '../../core/contracts/governance-contracts';
import { TenantScope } from '../../core/domains/control-plane/application/context';
import { OperationalIntentRepository, TransitionResult } from '../../core/ports/repositories/operational-intent-repository.interface';

export class MemoryOperationalIntentRepository implements OperationalIntentRepository {
  // Using an in-memory map. In PostgreSQL this would be a real table with transactions.
  private intents: Map<string, OperationalIntent> = new Map();

  async create(intent: OperationalIntent): Promise<OperationalIntent> {
    this.intents.set(intent.id, intent);
    return intent;
  }

  async findById(id: string, scope: TenantScope): Promise<OperationalIntent | null> {
    const intent = this.intents.get(id);
    if (!intent) return null;
    
    if (intent.organizationId !== scope.organizationId) {
      return null; // Act as if not found if tenant mismatch (Zero Trust)
    }
    return intent;
  }

  async findPending(scope: TenantScope): Promise<OperationalIntent[]> {
    return Array.from(this.intents.values()).filter(i => 
      i.organizationId === scope.organizationId && i.status === 'pending_approval'
    );
  }

  /**
   * ATOMIC COMPARE-AND-SET IMPLEMENTATION
   * Demonstrates the state-guarded transition without race conditions.
   */
  async transitionStatus(
    id: string, 
    scope: TenantScope, 
    expectedStatus: OperationalIntent['status'], 
    nextStatus: OperationalIntent['status']
  ): Promise<TransitionResult> {
    const intent = this.intents.get(id);
    
    // 1. Not Found
    if (!intent) {
      return { transitioned: false, reason: 'NOT_FOUND' };
    }

    // 2. Tenant Mismatch (Guard 1)
    if (intent.organizationId !== scope.organizationId) {
      return { transitioned: false, reason: 'TENANT_MISMATCH' };
    }

    // 3. Already Processed (Idempotency semantic guard)
    if (intent.status === nextStatus) {
      return { transitioned: false, reason: 'ALREADY_PROCESSED' };
    }

    // 4. Invalid State (Guard 2 - State atomic check)
    if (intent.status !== expectedStatus) {
      return { transitioned: false, reason: 'INVALID_STATE' };
    }

    // ATOMIC MUTATION (In DB this is: UPDATE status = nextStatus WHERE id = id AND status = expectedStatus)
    intent.status = nextStatus;
    intent.updatedAt = new Date();
    
    return { transitioned: true };
  }
}
