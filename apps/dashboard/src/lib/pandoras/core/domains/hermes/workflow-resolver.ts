import { WorkflowRegistry } from '../../execution/workflow-registry';
import { Intent } from './contracts';

export interface IWorkflowResolver {
  resolveByIntent(intent: Intent): Promise<string[] | null>;
}

export class SemanticWorkflowResolver implements IWorkflowResolver {
  constructor(private registry: WorkflowRegistry) {}

  async resolveByIntent(intent: Intent): Promise<string[] | null> {
    if (intent.type !== 'START_WORKFLOW') return null;

    // En producción: búsqueda vectorial sobre las descripciones de los workflows registrados
    // MVP: Búsqueda hardcodeada simulando entendimiento
    const payloadKeys = Object.keys(intent.payload);
    
    // Si la intención habla de S'Narai y Presupuesto, probablemente sea un Lanzamiento
    if (payloadKeys.includes('product') && payloadKeys.includes('budget')) {
      return ['commercial.product_launch.v1'];
    }

    // Si solo hay un prompt, podría ser Media
    if (payloadKeys.includes('prompt')) {
      return ['media.generate_asset.v1'];
    }

    return null;
  }
}
