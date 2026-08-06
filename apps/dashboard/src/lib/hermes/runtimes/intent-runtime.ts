import { CompiledExecutionManifest, IPipelineRuntime } from './orchestrator-types';

/**
 * Intent Runtime
 * 
 * Pipeline Stage 1.
 * Quickly classifies the user input to determine topics and intents.
 */
export class IntentRuntime implements IPipelineRuntime {
  async process(manifest: CompiledExecutionManifest, input: string): Promise<void> {
    const text = input.toLowerCase();
    
    if (text.includes('invertir') || text.includes('invest') || text.includes('tokenización')) {
      manifest.events.push({ type: 'intent_detected', intent: 'invest', topic: 'investment' });
    } else {
      manifest.events.push({ type: 'intent_detected', intent: 'general', topic: 'general' });
    }
  }
}
