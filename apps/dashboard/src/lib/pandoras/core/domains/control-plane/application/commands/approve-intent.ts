import { ApprovalService } from '~/lib/pandoras/core/domains/governance/approval-service';
import { ControlPlaneContext, AuthorizationError } from '../context';
import { OperationalIntentRepository } from '~/lib/pandoras/core/ports/repositories/operational-intent-repository.interface';

export class ApproveIntentCommand {
  constructor(
    private readonly approvalService: ApprovalService
  ) {}

  /**
   * Executes the approval command with Zero Trust authorization.
   */
  async execute(context: ControlPlaneContext, requestedOrganizationId: string, intentId: string, reason: string, idempotencyKey?: string): Promise<void> {
    console.log(`[Command] ApproveIntent: ${intentId} by actor ${context.actorId}`);
    
    // 1. Verify basic permission
    if (!context.permissions.includes('approve_intent')) {
      throw new AuthorizationError(`Actor ${context.actorId} is not authorized to approve intents.`);
    }

    // 2. Generate TenantScope directly from context
    const scope = context.requireOrganizationScope(requestedOrganizationId);

    // 3. Delegate to Domain Service with the scope
    await this.approvalService.approve(intentId, scope, context.actorId, reason, idempotencyKey);
  }
}
