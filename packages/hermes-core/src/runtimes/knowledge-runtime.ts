import { CompiledExecutionManifest, IPipelineRuntime } from './orchestrator-types';
import { artifactStore } from './artifact-store';
import { CompiledContentManifest } from './content-types';

/**
 * Knowledge Runtime
 * 
 * Pipeline Stage 2.
 * Consults the Universal AST (CompiledContentManifest) based on the detected topics/intents.
 * DOES NOT READ FILES. Only queries the compiled nodes.
 */
export class KnowledgeRuntime implements IPipelineRuntime {
  async process(manifest: CompiledExecutionManifest, input: string): Promise<void> {
    // 1. Load the Content AST from the Artifact Store
    const contentManifest: CompiledContentManifest | null = await artifactStore.loadLatestArtifact(manifest.tenantId, 'content');
    
    if (!contentManifest) {
      console.warn(`[KnowledgeRuntime] No CompiledContentManifest found for tenant ${manifest.tenantId}`);
      return;
    }

    // 2. Query the AST
    // We filter the nodes that contain the detected topics OR the strategy retrieveTopics
    const detectedTopics = manifest.events
      .filter(e => e.type === 'intent_detected' && e.topic)
      .map(e => e.topic);

    const strategyTopics = manifest.prospectContext?.strategy?.knowledgeStrategy?.retrieveTopics || [];
    const avoidTopics = manifest.prospectContext?.strategy?.knowledgeStrategy?.avoidTopics || [];

    const allSearchTopics = [...detectedTopics, ...strategyTopics];

    if (allSearchTopics.length > 0) {
      const relevantNodes = contentManifest.nodes.filter(node => {
        if (!node.topics) return false;
        // Ignore nodes that match avoidTopics
        if (node.topics.some((t: string) => avoidTopics.includes(t))) return false;
        // Include nodes that match search topics
        return node.topics.some((t: string) => allSearchTopics.includes(t));
      });
      
      manifest.relevantKnowledge.push(...relevantNodes);
      console.log(`[KnowledgeRuntime] Injected ${relevantNodes.length} nodes (Topics: ${allSearchTopics.join(', ')} | Avoided: ${avoidTopics.join(', ')}).`);
    }
  }
}
