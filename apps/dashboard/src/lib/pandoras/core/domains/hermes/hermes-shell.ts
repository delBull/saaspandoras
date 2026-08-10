import { 
  IHermesShell, 
  ConversationMessage, 
  HermesResponse 
} from './contracts';
import { IConversationManager } from './conversation-manager';
import { IIntentEngine } from './intent-engine';
import { IPlanner } from './planner';
import { IWorkflowResolver } from './workflow-resolver';
import { ExecutionIdentityAssembler } from '../../identity/assembler';
import { PandorasRuntime } from '../../sdk/create-runtime';

/**
 * Hermes Shell v1 - El Intérprete del OS
 * Transforma conversaciones asíncronas en ejecuciones orquestadas.
 */
export class HermesShell implements IHermesShell {
  constructor(
    private conversationManager: IConversationManager,
    private intentEngine: IIntentEngine,
    private workflowResolver: IWorkflowResolver,
    private planner: IPlanner,
    private runtime: PandorasRuntime
  ) {}

  async handleMessage(input: ConversationMessage): Promise<HermesResponse> {
    const userId = input.identitySnapshot.actor.userId;
    const channelId = input.identitySnapshot.metadata.sourceApp;
    
    console.log(`\n[HermesShell] Mensaje recibido de User '${userId}' vía '${channelId}'`);
    console.log(`[HermesShell] Texto: "${input.text}"`);

    // 1. Contexto Conversacional
    const state = await this.conversationManager.getOrCreateState(userId, channelId);
    await this.conversationManager.appendMessage(state.id, input);

    // 2. Extraer Intención
    const intent = await this.intentEngine.analyze(input, state);
    console.log(`[HermesShell] Intent deducido: ${intent.type} (Confidence: ${intent.confidence})`);

    // 3. Evaluar
    if (intent.type === 'CHAT' || intent.type === 'UNKNOWN') {
      return {
        type: 'MESSAGE',
        message: 'No estoy seguro de cómo ayudarte con eso. ¿Quieres iniciar un proceso o consultar el estado de algo?'
      };
    }

    if (intent.type === 'START_WORKFLOW') {
      // 4. Resolver Workflows
      const workflowIds = await this.workflowResolver.resolveByIntent(intent);
      
      if (!workflowIds || workflowIds.length === 0) {
        return {
          type: 'MESSAGE',
          message: 'No encontré un proceso registrado para realizar esa acción.'
        };
      }

      console.log(`[HermesShell] Workflows resueltos semánticamente: [${workflowIds.join(', ')}]`);

      // 5. Planificar
      const plan = await this.planner.generatePlan(intent, workflowIds);
      console.log(`[HermesShell] Plan generado con ${plan.steps.length} pasos.`);

      // 6. El Identity Snapshot ya fue ensamblado por el Bootstrap Layer (ADR-006)
      const identitySnapshot = input.identitySnapshot;
      console.log(`[HermesShell] Identity Snapshot hidratado recibido de capa superior.`);

      // 7. Ejecutar el plan (MVP: ejecuta el primer step)
      // En el futuro, el OS debería soportar recibir el `ExecutionPlan` completo
      const firstStep = plan.steps[0];
      
      if (!firstStep) {
        return {
          type: 'MESSAGE',
          message: 'Error al generar el plan de ejecución.'
        };
      }
      
      const instance = await this.runtime.startProcess(
        firstStep.workflowId, 
        firstStep.payloadMapping || {}, 
        identitySnapshot
      );

      console.log(`[HermesShell] SO instruido. Instancia creada: ${instance.id}`);

      // Retornar al Canal de entrada
      return {
        type: 'EXECUTION_STARTED',
        executionId: instance.id,
        executionPlan: plan,
        message: `Entendido. He iniciado el proceso para ti.`
      };
    }

    return {
      type: 'MESSAGE',
      message: 'Operación no soportada por el momento.'
    };
  }
}
