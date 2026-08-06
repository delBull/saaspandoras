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
        messages: decisions
          .filter(d => d.type === 'communicate')
          .map(d => `[${d.source}] ${d.payload?.task || 'respond'}`),
      },
    };

    return experience;
  }
}
