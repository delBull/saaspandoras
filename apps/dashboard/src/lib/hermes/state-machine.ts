import { SalesState } from './types';

/**
 * Sales State Machine Transition Engine
 * Validates and executes state transitions deterministically
 */

const ALLOWED_TRANSITIONS: Record<SalesState, SalesState[]> = {
  NEW: ['CONTACTED', 'ENGAGED'],
  CONTACTED: ['ENGAGED', 'QUALIFIED', 'NEGOTIATION'],
  ENGAGED: ['QUALIFIED', 'NEGOTIATION'],
  QUALIFIED: ['NEGOTIATION', 'READY'],
  NEGOTIATION: ['READY', 'CLOSED', 'ENGAGED'],
  READY: ['CLOSED', 'NEGOTIATION'],
  CLOSED: ['ADVOCATE'],
  ADVOCATE: []
};

export class SalesStateMachineEngine {
  static canTransition(fromState: SalesState, toState: SalesState): boolean {
    if (fromState === toState) return true;
    const allowed = ALLOWED_TRANSITIONS[fromState] || [];
    return allowed.includes(toState);
  }

  static transition(currentState: SalesState, targetState: SalesState): { success: boolean; nextState: SalesState; reason?: string } {
    if (this.canTransition(currentState, targetState)) {
      return { success: true, nextState: targetState };
    }
    return { 
      success: false, 
      nextState: currentState, 
      reason: `Transición inválida de ${currentState} a ${targetState}` 
    };
  }
}
