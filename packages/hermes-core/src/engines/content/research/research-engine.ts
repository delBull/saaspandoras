import { AttackPlan } from '../../../domains/campaign/campaign';
import { AIAdapter } from '../ai/ai-adapter-layer';

export interface CampaignContextEnrichment {
  competitorsInsights: string[];
  audienceInsights: string[];
  recommendedTone: string;
}

/**
 * Investiga y enriquece el contexto antes de generar assets.
 */
export class ResearchEngine {
  constructor(private ai: AIAdapter) {}

  public async enrich(attackPlan: AttackPlan): Promise<CampaignContextEnrichment> {
    console.log(`[Media Engine: Research] Investigando audiencia: ${attackPlan.targetAudience}`);
    
    // Simular el enriquecimiento usando IA
    await this.ai.generateText(`Research audience ${attackPlan.targetAudience} and suggest tone.`);

    return {
      competitorsInsights: ['La competencia usa mensajes muy técnicos.', 'Falta contenido educativo.'],
      audienceInsights: ['Prefieren consumo rápido en móvil.', 'Reaccionan bien al Social Proof.'],
      recommendedTone: 'Directo, autoritativo pero accesible.'
    };
  }
}
