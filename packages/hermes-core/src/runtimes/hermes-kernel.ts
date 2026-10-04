import { KernelContext, Decision } from './kernel-types';
import { moduleLoader } from './module-loader';

/**
 * Hermes OS — Kernel Orchestrator
 *
 * Runs the loaded decision providers against a KernelContext and renders an
 * "experience" (navigations, messages, blocked state) ordered by priority.
 * Uses only the existing provider architecture (IDecisionProvider + KernelContext).
 */
export interface KernelExperience {
  sessionId: string;
  tenantId: number;
  blocked: boolean;
  blockReason?: string;
  decisions: Decision[];
  actions: {
    navigate?: { path: string; reason?: string };
    messages: string[];
  };
  fallbackTriggered?: 'technical' | 'knowledge';
}


export class HermesKernel {
  async processInput(context: KernelContext): Promise<KernelExperience> {
    const decisions: Decision[] = [];

    for (const provider of moduleLoader.getProviders()) {
      const confidence = provider.canHandle(context);
      if (confidence <= 0) continue;
      const providerDecisions = await provider.generateDecision(context);
      decisions.push(...providerDecisions);
    }

    decisions.sort((a, b) => b.priority - a.priority);

    const blockingDecision = decisions.find(d => d.blocking);
    const navigate = decisions.find(d => d.type === 'navigate');

    const experience: KernelExperience = {
      sessionId: context.sessionId,
      tenantId: context.tenantId,
      blocked: !!blockingDecision,
      blockReason: blockingDecision
        ? (blockingDecision.payload?.reason || blockingDecision.source)
        : undefined,
      decisions,
      actions: {
        navigate: navigate?.payload?.path
          ? { path: navigate.payload.path, reason: navigate.payload.reason }
          : undefined,
        messages: blockingDecision
          ? [blockingDecision.payload?.task || blockingDecision.payload?.reason || 'Access denied']
          : decisions
              .filter(d => d.type === 'communicate')
              .map(d => d.payload?.task || 'respond'),
      },
    };

    // 1. Technical Fallback: No decisions were made (likely provider failure)
    if (decisions.length === 0) {
      experience.fallbackTriggered = 'technical';
      experience.actions.messages = ["[System] Experimento dificultades técnicas. Un asesor se pondrá en contacto pronto."];
      // Here we would dispatch an AUDIT EVENT for Human Escalation
    } 
    // 2. Knowledge Fallback: Provider explicitly indicated lack of knowledge
    else if (decisions.some(d => d.confidence < 0.2 && d.type === 'communicate')) {
      experience.fallbackTriggered = 'knowledge';
      experience.actions.messages = ["No tengo esa información confirmada en este momento, pero puedo tomar tus datos para que un especialista te contacte."];
    }

    return experience;
  }
}
