import { WorkflowDefinition } from '../../execution/workflow-definition';

export type OnboardingStage = 
  | 'BUSINESS_DISCOVERY' 
  | 'IDENTITY_CONFIGURATION' 
  | 'KNOWLEDGE_GATHERING' 
  | 'POLICY_DEFINITION' 
  | 'CHANNEL_SETUP' 
  | 'ACTIVATION';

/**
 * HERMES_ONBOARDING Workflow (Phase 6.3)
 * 
 * "Hermes is getting to know you."
 * The onboarding is a persistent Journey, not a React state machine.
 */
export const HermesOnboardingWorkflow: WorkflowDefinition<any, OnboardingStage> = {
  id: 'hermes.onboarding.v1',
  version: '1.0.0',
  initialState: 'BUSINESS_DISCOVERY',
  terminalStates: ['ACTIVATION'],
  stages: [
    'BUSINESS_DISCOVERY',
    'IDENTITY_CONFIGURATION',
    'KNOWLEDGE_GATHERING',
    'POLICY_DEFINITION',
    'CHANNEL_SETUP',
    'ACTIVATION'
  ],
  requiredCapabilities: [],
  inputType: 'OnboardingPayload',
  transitions: {
    'BUSINESS_DISCOVERY': ['IDENTITY_CONFIGURATION'],
    'IDENTITY_CONFIGURATION': ['KNOWLEDGE_GATHERING'],
    'KNOWLEDGE_GATHERING': ['POLICY_DEFINITION'],
    'POLICY_DEFINITION': ['CHANNEL_SETUP'],
    'CHANNEL_SETUP': ['ACTIVATION']
  }
};
