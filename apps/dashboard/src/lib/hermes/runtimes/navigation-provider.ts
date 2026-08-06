import { IDecisionProvider } from './decision-provider';
import { Decision, KernelContext, Capability } from './kernel-types';

export class NavigationProvider implements IDecisionProvider {
  id = 'NavigationProvider';
  providedCapabilities: Capability[] = ['routing.navigate'];
  requiredCapabilities: Capability[] = [];

  canHandle(context: KernelContext): number {
    return 1.0;
  }

  async generateDecision(context: KernelContext): Promise<Decision[]> {
    const isInvesting = context.input.toLowerCase().includes('invertir');
    const isAuthed = context.state['isAuthenticated'] === true;

    if (isInvesting && !isAuthed) {
      return [{
        source: this.id,
        type: 'navigate',
        authority: 'MEDIUM',
        priority: 700,
        confidence: 0.9,
        blocking: false,
        payload: { path: '/login', reason: 'Checkout requires auth' }
      }];
    }
    
    return [];
  }
}
