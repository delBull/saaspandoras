import { CompiledExecutionManifest, IPipelineRuntime } from './orchestrator-types';

/**
 * Media Runtime
 * 
 * Pipeline Stage 3.
 * Selects appropriate media assets based on the resolved intent, UI components, and the discovery graph.
 */
export class MediaRuntime implements IPipelineRuntime {
  async process(manifest: CompiledExecutionManifest, input: string): Promise<void> {
    const isInvesting = manifest.events.some(e => e.type === 'intent_detected' && e.intent === 'invest');

    if (isInvesting) {
      manifest.media.push('founder_video.mp4');
      manifest.media.push('investment_infographic.png');
    }
  }
}
