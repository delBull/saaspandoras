import { IExecutionJournal, ExecutionEvent } from '../execution/execution-journal';
import { KnowledgeAsset } from './knowledge-asset';

export class PatternExtractor {
  constructor(private journal: IExecutionJournal) {}

  /**
   * Extrae patrones (KnowledgeAssets) analizando el historial completo de una ejecución terminada.
   */
  async extractFromCompletedExecution(instanceId: string): Promise<KnowledgeAsset | null> {
    const history = await this.journal.getHistory(instanceId);
    if (!history || history.length === 0) return null;

    const startEvent = history.find(e => e.type === 'EXECUTION_STARTED');
    const endEvent = history.find(e => e.type === 'EXECUTION_COMPLETED');
    const decisionEvent = history.find(e => e.type === 'DECISION_SUBMITTED');

    if (!startEvent || !endEvent) return null;

    const startTime = new Date(startEvent.timestamp).getTime();
    const endTime = new Date(endEvent.timestamp).getTime();
    const durationMs = endTime - startTime;

    // Stub: Simulación de extracción de un patrón algorítmico/LLM
    let description = `El Workflow tardó ${durationMs}ms en completarse.`;
    if (decisionEvent) {
      description += ` Decisión humana detectada: ${decisionEvent.payload?.decision?.type}.`;
    }

    const asset: KnowledgeAsset = {
      id: `asset_${Date.now()}`,
      type: 'EXECUTION_PATTERN',
      title: `Execution Pattern for instance ${instanceId}`,
      description,
      tags: ['timing', 'performance'],
      content: { durationMs, decision: decisionEvent?.payload?.decision?.type },
      confidenceScore: 0.85,
      sourceInstanceIds: [instanceId],
      createdAt: new Date().toISOString()
    };

    return asset;
  }
}

