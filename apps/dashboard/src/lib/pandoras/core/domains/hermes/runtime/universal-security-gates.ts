import type { HermesSurfaceDefinition } from '../context/surface-definition';

export class UniversalSecurityGates {
  /**
   * Evaluates if a given raw user message attempts an execution intent
   * that is prohibited by the current surface definition.
   */
  static evaluatePreIntentGate(
    rawMessage: string,
    surfaceDef: HermesSurfaceDefinition
  ): { blocked: boolean; blockReason?: string } {
    // 1. Basic Action Parsing (Heuristics for execution vs read)
    // Note: A true parser would be more robust, but this prevents naive prompt execution.
    const executionKeywords = /(?:activa|ejecuta|aprueba|confirma|cancela|prepara distribuci[oó]n|diagnostica|convierte|asigna|haz|promueve|env[ií]a|manda|agrega|registra)/i;
    const isExecutionAttempt = executionKeywords.test(rawMessage);

    // 2. Cross-reference with Prohibited Actions
    // If the surface prohibits ANY form of execution, we block early.
    const hasExecutionBan = surfaceDef.prohibitedActions.includes('EXECUTE_ACTION') || 
                            surfaceDef.prohibitedActions.includes('GLOBAL_EXECUTE');

    if (isExecutionAttempt && hasExecutionBan) {
      return {
        blocked: true,
        blockReason: `Execution intent blocked by Surface Envelope (${surfaceDef.surface}). Allowed actions: ${surfaceDef.allowedActions.join(', ')}`,
      };
    }

    return { blocked: false };
  }

  /**
   * Evaluates post-LLM intent / capability escalations.
   * Ensures the LLM did not invent an action outside the Surface Definition.
   */
  static evaluatePostIntentGate(
    proposedAction: string,
    surfaceDef: HermesSurfaceDefinition
  ): { blocked: boolean; blockReason?: string } {
    if (surfaceDef.prohibitedActions.includes(proposedAction)) {
      return {
        blocked: true,
        blockReason: `Action ${proposedAction} is explicitly prohibited in ${surfaceDef.surface}`,
      };
    }
    
    // Check if the action is generically an EXECUTE_ACTION and we forbid it
    if (proposedAction.includes('EXECUTE') && 
       (surfaceDef.prohibitedActions.includes('EXECUTE_ACTION') || surfaceDef.prohibitedActions.includes('GLOBAL_EXECUTE'))) {
      return {
        blocked: true,
        blockReason: `Execution actions are prohibited in ${surfaceDef.surface}`,
      };
    }

    return { blocked: false };
  }
}
