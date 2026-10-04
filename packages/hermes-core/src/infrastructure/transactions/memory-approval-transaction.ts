import { ApprovalTransaction } from "@saasfly/hermes-core";
import { TenantScope } from "@saasfly/hermes-core";
import { GovernanceEvent } from "@saasfly/hermes-core";
import { OperationalIntent } from "@saasfly/hermes-core";
import { TransitionResult, OperationalIntentRepository } from "@saasfly/hermes-core";
import { GovernanceEventRepository } from "@saasfly/hermes-core";

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
