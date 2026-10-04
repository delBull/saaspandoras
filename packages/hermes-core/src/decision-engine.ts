import { CustomerMemory, HermesMission, SalesState } from './types';
import { KnowledgePackLoader } from './knowledge-pack';
import { SalesStateMachineEngine } from './state-machine';

/**
 * Hermes Core Decision & Mission Orchestrator Engine
 * Evaluates customer memory, active knowledge pack and executes autonomous missions
 */
export class HermesDecisionEngine {
  static async evaluateNextMission(
    projectSlug: string,
    memory: CustomerMemory,
    currentState: SalesState,
    latestUserMessage?: string
  ): Promise<{ mission: HermesMission; recommendedAction: string }> {
    const pack = await KnowledgePackLoader.getPack(projectSlug);
    let targetState = currentState;

    // Detect objection trigger pattern
    let matchedObjection = null;
    if (latestUserMessage) {
      for (const rule of pack.objectionRules) {
        const regex = new RegExp(rule.triggerPattern, 'i');
        if (regex.test(latestUserMessage)) {
          matchedObjection = rule;
          break;
        }
      }
    }

    // Determine target state transition
    if (matchedObjection) {
      targetState = 'NEGOTIATION';
    } else if (latestUserMessage && (latestUserMessage.toLowerCase().includes('comprar') || latestUserMessage.toLowerCase().includes('pagar') || latestUserMessage.toLowerCase().includes('involucrar'))) {
      targetState = 'READY';
    } else if (currentState === 'NEW' || currentState === 'CONTACTED') {
      targetState = 'ENGAGED';
    }

    const transition = SalesStateMachineEngine.transition(currentState, targetState);
    const activeState = transition.nextState;

    // Construct autonomous mission
    const missionId = `MIS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    let goal: HermesMission['goal'] = 'QUALIFY_LEAD';

    if (activeState === 'NEGOTIATION') goal = 'HANDLE_OBJECTION';
    else if (activeState === 'READY') goal = 'CLOSE_SALE';
    else if (activeState === 'CLOSED') goal = 'CLOSE_SALE';

    const mission: HermesMission = {
      id: missionId,
      leadId: memory.leadId,
      goal,
      targetState: activeState,
      status: 'IN_PROGRESS',
      createdAt: Date.now(),
      steps: [
        { stepName: 'ANALYZING_MEMORY', status: 'EXECUTED', executedAt: Date.now() },
        { stepName: 'EVALUATING_KNOWLEDGE_PACK', status: 'EXECUTED', executedAt: Date.now() },
        { stepName: 'EXECUTING_STATE_TRANSITION', status: 'EXECUTED', result: `Transition to ${activeState}`, executedAt: Date.now() }
      ],
      logs: [`Mission ${missionId} created. Current State: ${currentState} -> ${activeState}`]
    };

    let recommendedAction = pack.salesPitch;
    if (matchedObjection) {
      recommendedAction = matchedObjection.recommendedResponse;
    }

    return { mission, recommendedAction };
  }
}
