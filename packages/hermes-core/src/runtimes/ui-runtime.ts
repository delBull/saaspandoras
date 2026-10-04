import { CompiledExecutionManifest, IPipelineRuntime } from './orchestrator-types';

/**
 * UI Runtime
 * 
 * Pipeline Stage 2.
 * Analyzes the execution manifest (intents, stage, topic) and decides which UI components to render.
 */
export class UIRuntime implements IPipelineRuntime {
  async process(manifest: CompiledExecutionManifest, input: string): Promise<void> {
    const isInvesting = manifest.events.some(e => e.type === 'intent_detected' && e.intent === 'invest');

    if (isInvesting) {
      manifest.ui.push('InvestmentGrid');
      manifest.ui.push('RiskBanner');
      manifest.ui.push('FAQAccordion');
    } else {
      manifest.ui.push('GeneralNavigation');
    }
  }
}
