import { ServiceProvider, ExecutionRequest, ExecutionResult, Artifact } from '../../contracts';
import { CampaignPlanner } from './planners/campaign-planner';
import { ResearchEngine } from './research/research-engine';
import { AssetEngine } from './assets/asset-engine';
import { MockAIAdapter } from './ai/ai-adapter-layer';
import { AttackPlan } from '../../domains/campaign/campaign';

/**
 * Pandora's Media Engine (MVP)
 * Encapsula la orquestación interna de Planner -> Research -> Asset Gen.
 */
export class MediaEngineProvider implements ServiceProvider {
  public id = 'pandoras-media-engine';
  public version = '1.0.0';
  public domain = 'MEDIA';
  public supportedCapabilities = ['media.fulfillCampaign'];

  // Dependencias internas (motores)
  private aiAdapter = new MockAIAdapter();
  private planner = new CampaignPlanner(this.aiAdapter);
  private research = new ResearchEngine(this.aiAdapter);
  private assetEngine = new AssetEngine(this.aiAdapter);

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      if (request.capability !== 'media.fulfillCampaign') {
        throw new Error(`Capability no soportada: ${request.capability}`);
      }

      const attackPlan: AttackPlan = request.input.attackPlan;
      if (!attackPlan) throw new Error("Falta el AttackPlan en el input.");

      console.log(`[MediaEngine] Iniciando fulfillCampaign para: ${attackPlan.objective}`);

      // 1. Planificación (De Misión Comercial a Plan Editorial)
      const editorialPlan = await this.planner.createPlan(attackPlan);

      // 2. Investigación (Enriquecimiento de Contexto)
      const enrichment = await this.research.enrich(attackPlan);

      // 3. Generación de Artefactos (Texto, Imágenes)
      const generatedArtifacts = await this.assetEngine.generateAssets(editorialPlan.pieces, enrichment);

      // Retornar el resultado enriquecido para que el Campaign Director actualice el CampaignContext
      return {
        success: true,
        actionExecuted: 'media.fulfillCampaign',
        data: {
          editorialPlan,
          enrichment
        },
        artifacts: generatedArtifacts
      };

    } catch (error: any) {
      console.error("[MediaEngine] Error en fulfillCampaign", error);
      return {
        success: false,
        actionExecuted: 'media.fulfillCampaign',
        data: null,
        error: { code: 'MEDIA_ERROR', message: error.message }
      };
    }
  }

  async validate(request: ExecutionRequest): Promise<boolean> {
    return this.supportedCapabilities.includes(request.capability);
  }
}
