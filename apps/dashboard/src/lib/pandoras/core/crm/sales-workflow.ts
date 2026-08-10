import { WorkflowDefinition } from '../execution/workflow-definition';
import { Opportunity } from './crm-models';

/**
 * Definición declarativa de un Workflow de Ventas Comercial.
 * Demuestra cómo un pipeline de ventas es simplemente otro Workflow ejecutándose sobre el Kernel.
 */
export const SalesPipelineWorkflow: WorkflowDefinition<Opportunity, Opportunity['stage']> = {
  id: 'sales.pipeline.v1',
  version: '1.0.0',
  initialState: 'PROSPECT',
  terminalStates: ['CLOSED_WON', 'CLOSED_LOST'],
  stages: ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'CLOSED_WON', 'CLOSED_LOST'],
  requiredCapabilities: ['crm.scoreOpportunity', 'commercial.submitDecision'],
  inputType: 'OpportunityPayload'
};
