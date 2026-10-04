import { AttackPlan } from '../../../domains/campaign/campaign';
import { AIAdapter } from '../ai/ai-adapter-layer';

export interface ContentPiece {
  id: string;
  type: 'POST' | 'EMAIL' | 'VIDEO' | 'LANDING' | 'AD';
  platform?: string;
  topic: string;
  format: string;
  targetDate?: string;
}

export interface EditorialPlan {
  theme: string;
  pieces: ContentPiece[];
  frequency: string;
}

/**
 * Convierte un AttackPlan (de alto nivel comercial) en un Plan Editorial concreto.
 */
export class CampaignPlanner {
  constructor(private ai: AIAdapter) {}

  public async createPlan(attackPlan: AttackPlan): Promise<EditorialPlan> {
    console.log(`[Media Engine: Planner] Procesando AttackPlan para objetivo: ${attackPlan.objective}`);
    
    // Aquí el AI Adapter analizaría el AttackPlan y propondría el mix de contenidos.
    // Simularemos la respuesta para el MVP.
    const prompt = `Create an editorial plan for objective: ${attackPlan.objective} on channels: ${attackPlan.channels.join(',')}`;
    await this.ai.generateText(prompt);

    const pieces: ContentPiece[] = attackPlan.channels.map((channel: string, i: number) => ({
      id: `cp_00${i}`,
      type: channel.toLowerCase().includes('email') ? 'EMAIL' : 'POST',
      platform: channel,
      topic: `Highlights for ${attackPlan.targetAudience}`,
      format: 'short-form'
    }));

    return {
      theme: `Dominando el mercado: ${attackPlan.objective}`,
      pieces,
      frequency: '2 times a week'
    };
  }
}
