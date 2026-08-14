import { Intent, ConversationMessage } from './contracts';
import { ConversationState } from './conversation-manager';

export interface IIntentEngine {
  analyze(message: ConversationMessage, state: ConversationState): Promise<Intent>;
}

/**
 * MVP del Motor de Intenciones.
 * En producción esto llama a un LLM pequeño (Router) con el historial de la conversación.
 */
export class MockIntentEngine implements IIntentEngine {
  async analyze(message: ConversationMessage, state: ConversationState): Promise<Intent> {
    const text = message.text.toLowerCase();

    if (text.includes('cancelar') || text.includes('detener')) {
      return {
        type: 'CANCEL_WORKFLOW',
        confidence: 0.95,
        payload: {}
      };
    }

    if (text.includes('estado') || text.includes('cómo va')) {
      return {
        type: 'QUERY_STATUS',
        confidence: 0.9,
        payload: {}
      };
    }

    if (text.includes('lanzar') || text.includes('crear') || text.includes('generar')) {
      // Intentamos extraer parámetros simples para el demo (tenant-agnostic)
      const payload: any = {};
      if (text.includes('50k') || text.includes('50 mil')) payload.budget = 50000;

      return {
        type: 'START_WORKFLOW',
        confidence: 0.85,
        payload
      };
    }

    if (text.includes('hola') || text.includes('ayuda')) {
      return {
        type: 'CHAT',
        confidence: 0.99,
        payload: {}
      };
    }

    // Default o desconocido
    return {
      type: 'UNKNOWN',
      confidence: 0.1,
      payload: {}
    };
  }
}
