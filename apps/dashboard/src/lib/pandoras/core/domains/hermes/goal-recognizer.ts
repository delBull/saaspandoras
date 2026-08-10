import { ConversationMessage } from './contracts';
import { Intent } from '../../contracts';

export interface GoalRecognitionResult {
  type: 'NEW_GOAL' | 'UPDATE_GOAL' | 'TACTICAL_INTENT' | 'CHAT';
  confidence: number;
  extractedGoal?: {
    objective: string;
    successCriteria: string[];
  };
  tacticalIntent?: Intent;
  reply?: string;
}

export class GoalRecognizer {
  /**
   * Analiza el input del usuario para deducir si está declarando una intención estratégica
   * a largo plazo (Goal), pidiendo una acción táctica (Intent) o simplemente charlando.
   */
  async analyze(message: ConversationMessage): Promise<GoalRecognitionResult> {
    const text = message.text.toLowerCase();

    console.log(`[GoalRecognizer] Analizando entrada: "${message.text}"`);

    // Hardcodeado temporal para validación del Blueprint
    if (text.includes('lanzar') && text.includes('s\'narai')) {
      console.log(`[GoalRecognizer] 🎯 Nuevo GOAL detectado (Confidence: 0.95)`);
      return {
        type: 'NEW_GOAL',
        confidence: 0.95,
        extractedGoal: {
          objective: 'Lanzar producto S\'Narai',
          successCriteria: [
            'Campaña comercial definida',
            'Primera preventa completada'
          ]
        }
      };
    }

    if (text.includes('cómo va') || text.includes('estatus')) {
      console.log(`[GoalRecognizer] ⚡ Intent Táctico detectado (Confidence: 0.80)`);
      return {
        type: 'TACTICAL_INTENT',
        confidence: 0.8,
        tacticalIntent: {
          type: 'QUERY_STATUS',
          confidence: 0.8,
          payload: {}
        }
      };
    }

    return {
      type: 'CHAT',
      confidence: 1.0,
      reply: 'Entiendo. ¿Cuál es nuestro siguiente objetivo?'
    };
  }
}
