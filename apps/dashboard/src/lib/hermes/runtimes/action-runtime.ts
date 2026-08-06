import { CompiledExecutionManifest, IPipelineRuntime } from './orchestrator-types';

/**
 * Action Runtime
 * 
 * Pipeline Stage 4.
 * Evaluates the current state to authorize or trigger specific application actions.
 */
export class ActionRuntime implements IPipelineRuntime {
  async process(manifest: CompiledExecutionManifest, input: string): Promise<void> {
    const isInvesting = manifest.events.some(e => e.type === 'intent_detected' && e.intent === 'invest');

    if (isInvesting) {
      manifest.actions.push('schedule_call');
      manifest.navigation.push('/investment/checkout');
    }
  }
}
