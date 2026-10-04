import { IDecisionProvider } from './decision-provider';
import { Decision, KernelContext, Capability } from './kernel-types';

export class SecurityProvider implements IDecisionProvider {
  id = 'SecurityProvider';
  providedCapabilities: Capability[] = ['security.authorize'];
  requiredCapabilities: Capability[] = [];

  canHandle(context: KernelContext): number {
    return 1.0; // Always evaluates security
  }

  async generateDecision(context: KernelContext): Promise<Decision[]> {
    const isInvesting = context.input.toLowerCase().includes('invertir');
    const isAuthed = context.state['isAuthenticated'] === true;

    if (isInvesting && !isAuthed) {
      return [{
        source: this.id,
        type: 'block',
        authority: 'HIGH',
        priority: 1000,
        confidence: 1.0,
        blocking: true,
        payload: { reason: 'auth_required', targetAction: 'checkout' }
      }];
    }
    return [];
  }
}
