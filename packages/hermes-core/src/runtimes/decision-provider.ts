import { Decision, KernelContext, Capability } from './kernel-types';

export interface IDecisionProvider {
  readonly id: string;
  readonly providedCapabilities: Capability[];
  readonly requiredCapabilities: Capability[];

  canHandle(context: KernelContext): number; // 0.0 to 1.0 (confidence)
  generateDecision(context: KernelContext): Promise<Decision[]>;
}
