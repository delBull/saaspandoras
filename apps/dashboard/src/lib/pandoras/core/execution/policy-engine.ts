import { ExecutionInstance } from './execution-instance';
import { WorkflowDefinition } from './workflow-definition';
import { Identity } from '../contracts';

/**
 * Contrato base para una Política.
 */
export interface PolicyDefinition {
  id: string; // Ej. 'strict_budget_limit'
  name: string;
  description: string;
  domain: string; // A qué dominio pertenece esta regla (ej. commercial, security)
}

/**
 * Resultados posibles al evaluar una política.
 */
export interface PolicyEvaluationResult {
  allowed: boolean;
  reason?: string;
  requiredAction?: string;
}

/**
 * Policy Engine (El Juez)
 * Evalúa si una instancia tiene permitido avanzar, ejecutarse o interactuar
 * basado en reglas independientes al workflow.
 */
export interface IPolicyEngine {
  
  canExecute(
    workflow: WorkflowDefinition, 
    instance: ExecutionInstance, 
    identity: Identity
  ): Promise<PolicyEvaluationResult>;
  
  canTransition(
    instance: ExecutionInstance, 
    targetState: string, 
    identity: Identity
  ): Promise<PolicyEvaluationResult>;
}
