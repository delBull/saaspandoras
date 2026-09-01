/**
 * 📦 Dash Contracts — Growth Automations & Reactive Workflows
 * src/lib/dash-contracts/growth/automations.ts
 */

export interface GrowthWorkflowRuleDTO {
  id: string;
  name: string;
  triggerEvent: 'LEAD_CREATED' | 'LEAD_QUALIFIED' | 'PAYMENT_RECEIVED' | 'JOURNEY_COMPLETED';
  actionType: 'SEND_EMAIL' | 'MINT_PASS' | 'NOTIFY_HERMES' | 'CREATE_TASK';
  status: 'ACTIVE' | 'PAUSED';
  executionsCount: number;
  lastExecutedAt?: string;
  createdAt: string;
}

export interface GetAutomationsResponseDTO {
  workflows: GrowthWorkflowRuleDTO[];
  activeCount: number;
}
