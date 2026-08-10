import { EventSubscriber } from '../platform/events/event-subscriber';
import { ExecutionEvent } from '../execution/execution-journal';
import { PatternExtractor } from './pattern-extractor';
import { AssetRepository } from './asset-repository';

export class KnowledgeEngine implements EventSubscriber {
  readonly subscriberId = 'knowledge_engine_v1';
  // Escuchamos cuando un workflow termina, o cuando ocurre un evento crítico a analizar
  readonly subscribedEventTypes = ['EXECUTION_COMPLETED', 'DECISION_SUBMITTED'];

  constructor(
    private extractor: PatternExtractor,
    private repository: AssetRepository
  ) {}

  async handleEvent(event: ExecutionEvent): Promise<void> {
    console.log(`[KnowledgeEngine] Analizando evento: ${event.type} de la instancia ${event.instanceId}`);
    
    // Si el workflow terminó, analizamos toda la ejecución para extraer assets (ej. patrones de ejecución)
    if (event.type === 'EXECUTION_COMPLETED') {
      const asset = await this.extractor.extractFromCompletedExecution(event.instanceId);
      if (asset) {
        await this.repository.save(asset);
        console.log(`[KnowledgeEngine] Asset generado: [${asset.type}] ${asset.title}`);
      }
    }
    
    // Podríamos también analizar decisiones aisladas en tiempo real
    if (event.type === 'DECISION_SUBMITTED') {
       // lógica para aprender de micro-decisiones
    }
  }
}
