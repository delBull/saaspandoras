import { CompiledExecutionManifest, IPipelineRuntime } from './orchestrator-types';
import { ProspectStrategyService } from './prospect-strategy-service';

/**
 * Hermes OS — Conversation Runtime
 * 
 * Pipeline Stage 3 (After Intelligence and Knowledge).
 * Acts as the "LLM Renderer".
 * Reads the CompiledExecutionManifest and generates the conversational response/intents.
 */
export class ConversationRuntime implements IPipelineRuntime {
  
  async process(manifest: CompiledExecutionManifest, input: string): Promise<void> {
    console.log(`[ConversationRuntime] Processing input: "${input}"`);
    
    let systemPrompt = 'You are Hermes, the AI Agent.';
    
    // P5: Inject Prospect Intelligence Summary
    if (manifest.prospectContext) {
      const prospectSummary = ProspectStrategyService.generateContextSummary(manifest.prospectContext);
      systemPrompt += `\n\n${prospectSummary}`;
      console.log(`[ConversationRuntime] Injected Prospect Intelligence Summary into prompt.`);
    }

    // In a real implementation, this would call the LLM with the systemPrompt.
    // Mocking an LLM response based on the input
    const isInvesting = input.toLowerCase().includes('invertir') || input.toLowerCase().includes('invest');
    
    if (isInvesting) {
      manifest.events.push({ type: 'intent_detected', intent: 'invest' });
      // We push messages to an internal queue inside the manifest.
      // Wait, the interface says we mutate `manifest` pipeline state. Let's add `messages` to the manifest pipeline state.
      (manifest as any).messages = [
        { role: 'assistant', content: '¡Excelente decisión! La tokenización inmobiliaria ofrece grandes ventajas.' }
      ];
    } else {
      (manifest as any).messages = [
        { role: 'assistant', content: `Entiendo. Me dijiste: "${input}". ¿En qué más puedo ayudarte hoy?` }
      ];
    }
  }
}
