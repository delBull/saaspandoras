import { CompiledExecutionManifest, IPipelineRuntime } from './orchestrator-types';

/**
 * Hermes OS — Conversation Runtime
 * 
 * Pipeline Stage 1.
 * Acts as the "LLM Renderer". Does NOT know about tenants, DBs, or packs.
 * Reads the CompiledExecutionManifest and generates the conversational response/intents.
 */
export class ConversationRuntime implements IPipelineRuntime {
  
  async process(manifest: CompiledExecutionManifest, input: string): Promise<void> {
    console.log(`[ConversationRuntime] Processing input: "${input}"`);
    
    // In a real implementation, this would:
    // 1. Build a prompt context from manifest.runtimeConfig, manifest.discoveryGraph, manifest.relevantKnowledge
    // 2. Call the LLM (OpenAI/Anthropic/Gemini)
    // 3. Parse the LLM output (messages, detected intents)
    
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
