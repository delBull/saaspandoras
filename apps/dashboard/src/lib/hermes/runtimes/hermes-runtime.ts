import { CompiledExecutionManifest, ExecutionResult } from './orchestrator-types';
import { CompiledRuntimeManifest } from './pack-types';
import { CompiledDiscoveryManifest } from './discovery-types';

import { ConversationRuntime } from './conversation-runtime';
import { UIRuntime } from './ui-runtime';
import { MediaRuntime } from './media-runtime';
import { ActionRuntime } from './action-runtime';
import { IntentRuntime } from './intent-runtime';
import { KnowledgeRuntime } from './knowledge-runtime';

/**
 * Hermes OS — Application Runtime Orchestrator
 * 
 * The central brain of the OS.
 * Receives the HTTP input, creates the turn's ExecutionManifest, and passes it through the Execution Pipeline.
 * Outputs a full ExecutionResult (Experiences).
 */
export class HermesRuntime {
  private pipeline = [
    new IntentRuntime(),
    new KnowledgeRuntime(),
    new ConversationRuntime(),
    new UIRuntime(),
    new MediaRuntime(),
    new ActionRuntime(),
  ];

  /**
   * Executes a single turn of the Hermes Application Runtime.
   * 
   * @param sessionId - The current session
   * @param tenantId - The resolved tenant
   * @param input - The user's input
   * @param runtimeConfig - The tenant's compiled runtime config
   * @param discoveryGraph - The tenant's compiled discovery graph
   */
  async execute(
    sessionId: string,
    tenantId: number,
    input: string,
    runtimeConfig: CompiledRuntimeManifest,
    discoveryGraph: CompiledDiscoveryManifest
  ): Promise<ExecutionResult> {
    console.log(`[HermesRuntime] Starting execution for session ${sessionId} - input: "${input}"`);

    // 1. Build the base ExecutionManifest for this turn
    const manifest: CompiledExecutionManifest = {
      sessionId,
      tenantId,
      runtimeConfig,
      discoveryGraph,
      relevantKnowledge: [],
      ui: [],
      media: [],
      actions: [],
      navigation: [],
      permissions: [],
      connectors: [],
      events: [],
      analytics: [],
      generatedAt: new Date(),
    };

    // 2. Run the Execution Pipeline
    // Each runtime inspects the manifest, reads the context, and mutates the manifest state
    for (const stage of this.pipeline) {
      await stage.process(manifest, input);
    }

    // 3. Construct the final ExecutionResult (Experience) from the mutated manifest
    const result: ExecutionResult = {
      messages: (manifest as any).messages || [],
      ui: manifest.ui,
      media: manifest.media,
      actions: manifest.actions,
      navigation: (manifest as any).navigation || [],
      events: manifest.events,
    };

    console.log(`[HermesRuntime] Execution complete. Returning experience with ${result.messages.length} messages, ${result.ui.length} UI components, ${result.actions.length} actions.`);

    return result;
  }
}
