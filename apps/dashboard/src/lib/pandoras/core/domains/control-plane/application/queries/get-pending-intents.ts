import { ControlPlaneContext } from '../context';
import { GovernanceQueueView } from '../../view-models';
import { OperationalIntentRepository } from '~/lib/pandoras/core/ports/repositories/operational-intent-repository.interface';

export class GetPendingIntentsQuery {
  constructor(
    private readonly intentRepo: OperationalIntentRepository
  ) {}

  async execute(context: ControlPlaneContext, requestedOrganizationId: string): Promise<GovernanceQueueView> {
    context.assertOrganizationAccess(requestedOrganizationId);
    const scope = context.requireOrganizationScope(requestedOrganizationId);

    const intents = await this.intentRepo.findPending(scope);

    return {
      organizationId: requestedOrganizationId,
      pendingIntents: intents.map(intent => ({
        intentId: intent.id,
        missionId: intent.missionId,
        missionName: `Mission ${intent.missionId}`, // Will be enriched once MissionRepo is joined
        strategyDecision: intent.objective,
        reasonSummary: intent.rationale,
        intentType: intent.intentType,
        budget: this.extractBudgetConstraint(intent.constraints),
        authorityRequired: intent.approvalPolicy.required ? 'Founder approval' : undefined,
        consequence: `Execution OS will receive ${intent.intentType}`,
        pack: `${intent.packId} ${intent.packVersion}`,
        status: intent.status,
      })),
    };
  }

  private extractBudgetConstraint(constraints: any[]): string | undefined {
    if (!Array.isArray(constraints)) return undefined;
    const budget = constraints.find(c => c.type === 'budget');
    return budget ? String(budget.value) : undefined;
  }
}
