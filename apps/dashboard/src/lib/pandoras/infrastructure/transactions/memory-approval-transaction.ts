import { ApprovalTransaction } from '../../core/ports/transactions/approval-transaction.interface';
import { TenantScope } from '../../core/domains/control-plane/application/context';
import { GovernanceEvent } from '../../core/domains/governance/events/contracts';
import { OperationalIntent } from '../../core/contracts/governance-contracts';
import { TransitionResult, OperationalIntentRepository } from '../../core/ports/repositories/operational-intent-repository.interface';
import { GovernanceEventRepository } from '../../core/ports/repositories/governance-event-repository.interface';

export class MemoryApprovalTransaction implements ApprovalTransaction {
  constructor(
    private readonly intentRepository: OperationalIntentRepository,
    private readonly eventRepository: GovernanceEventRepository,
    // Add outbox repository if we have one for memory
    private readonly memoryOutbox: any[] = []
  ) {}

  async execute(
    intentId: string,
    scope: TenantScope,
    expectedStatus: OperationalIntent['status'],
    nextStatus: OperationalIntent['status'],
    event: GovernanceEvent,
    outboxPayload: any
  ): Promise<TransitionResult> {
    
    // In memory, we rely on the synchronous transition provided by the intent repository
    // In a real environment, this might need a mutex, but for our tests, node's event loop
    // guarantees sequential execution of synchronous blocks.
    
    const result = await this.intentRepository.transitionStatus(intentId, scope, expectedStatus, nextStatus);
    
    if (result.transitioned) {
      await this.eventRepository.append(event);
      this.memoryOutbox.push(outboxPayload);
    }
    
    return result;
  }
}
