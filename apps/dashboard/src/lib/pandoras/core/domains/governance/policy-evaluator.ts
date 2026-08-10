import { OperationalIntent } from '../../contracts/governance-contracts';

export class PolicyEvaluator {
  
  /**
   * Evalúa las políticas de una intención propuesta.
   * Retorna true si la intención necesita aprobación humana.
   * Retorna false si puede auto-aprobarse.
   */
  evaluate(intent: OperationalIntent): boolean {
    console.log(`[PolicyEvaluator] Evaluating policies for intent ${intent.id} (${intent.intentType})`);
    
    // Si la política requiere explícitamente aprobación
    if (intent.approvalPolicy.required) {
      console.log(`[PolicyEvaluator] Policy requires explicit approval. Reason: ${intent.approvalPolicy.reason}`);
      return true;
    }

    // Ejemplo de reglas genéricas: Todo budget mayor a 10,000 MXN requiere aprobación
    const budgetConstraint = intent.constraints.find(c => c.type === 'budget');
    if (budgetConstraint) {
      // Simplificado: asume que budget es string "50000 MXN" o similar, o un objeto
      const val = typeof budgetConstraint.value === 'string' 
        ? parseInt(budgetConstraint.value.replace(/[^0-9]/g, ''), 10) 
        : 0;
      
      if (val > 10000) {
        console.log(`[PolicyEvaluator] Budget constraint (${val}) exceeds threshold. Requires approval.`);
        return true;
      }
    }

    console.log(`[PolicyEvaluator] Intent can be auto-approved.`);
    return false;
  }
}
