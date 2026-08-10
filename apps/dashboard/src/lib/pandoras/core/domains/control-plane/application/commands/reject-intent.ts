import { ApprovalService } from '~/lib/pandoras/core/domains/governance/approval-service';
import { ControlPlaneContext, AuthorizationError } from '../context';
import { OperationalIntentRepository } from '~/lib/pandoras/core/ports/repositories/operational-intent-repository.interface';

export class RejectIntentCommand {
  constructor(
    private readonly approvalService: ApprovalService
  ) {}

  /**
   * Executes the rejection command with Zero Trust authorization.
   */
  async execute(context: ControlPlaneContext, requestedOrganizationId: string, intentId: string, reason: string, idempotencyKey?: string): Promise<void> {
    console.log(`[Command] RejectIntent: ${intentId} by actor ${context.actorId}`);
    
    // 1. Verify permission
    if (!context.permissions.includes('reject_intent')) {
      throw new AuthorizationError(`Actor ${context.actorId} is not authorized to reject intents.`);
    }

    // 2. Generate TenantScope
    const scope = context.requireOrganizationScope(requestedOrganizationId);

    // 3. Delegate to Domain Service
    await this.approvalService.reject(intentId, scope, context.actorId, reason, idempotencyKey);
  }
}
