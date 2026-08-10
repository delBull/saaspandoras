import { PendingAction, ExecutionIdentitySnapshot } from '../../contracts';

export interface ConversationMessage {
  identitySnapshot: ExecutionIdentitySnapshot;
  text: string;
  metadata?: Record<string, any>;
}

export interface ExecutionPlanStep {
  workflowId: string;
  order: number;
  dependencies?: string[];
  payloadMapping?: Record<string, string>;
}

export interface ExecutionPlan {
  id: string;
  goal: string;
  steps: ExecutionPlanStep[];
}

export interface HermesResponse {
  type: 'MESSAGE' | 'EXECUTION_STARTED' | 'WAITING_FOR_INPUT' | 'PLAN_GENERATED';
  message?: string;
  executionId?: string;
  pendingActions?: PendingAction[];
  executionPlan?: ExecutionPlan;
}

export interface Intent {
  type: 
    | 'START_WORKFLOW' 
    | 'RESUME_WORKFLOW' 
    | 'CANCEL_WORKFLOW' 
    | 'QUERY_STATUS' 
    | 'SEARCH_KNOWLEDGE' 
    | 'CHAT' 
    | 'UNKNOWN';
  confidence: number;
  payload: Record<string, any>;
}

export interface IHermesShell {
  handleMessage(input: ConversationMessage): Promise<HermesResponse>;
}
