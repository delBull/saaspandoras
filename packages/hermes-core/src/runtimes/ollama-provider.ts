import { IDecisionProvider } from './decision-provider';
import { Decision, KernelContext, Capability } from './kernel-types';

export class OllamaDecisionProvider implements IDecisionProvider {
  id = 'OllamaProvider';
  providedCapabilities: Capability[] = ['language.generate'];
  requiredCapabilities: Capability[] = [];

  canHandle(context: KernelContext): number {
    return 0.8; // High confidence it can chat about anything
  }

  async generateDecision(context: KernelContext): Promise<Decision[]> {
    // In reality, this would call Ollama. For now, it's a mock.
    const isInvesting = context.input.toLowerCase().includes('invertir');
    
    if (isInvesting) {
      return [{
        source: this.id,
        type: 'communicate',
        authority: 'LOW', // AI answers usually have low authority compared to business rules
        priority: 500,
        confidence: 0.9,
        blocking: false,
        payload: { task: 'explain_investment' }
      }];
    }

    return [{
      source: this.id,
      type: 'communicate',
      authority: 'LOW',
      priority: 500,
      confidence: 0.8,
      blocking: false,
      payload: { task: 'greet' }
    }];
  }
}
