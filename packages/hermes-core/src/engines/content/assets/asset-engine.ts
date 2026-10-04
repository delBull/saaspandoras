import { Artifact } from '../../../contracts';
import { AIAdapter } from '../ai/ai-adapter-layer';
import { ContentPiece } from '../planners/campaign-planner';
import { CampaignContextEnrichment } from '../research/research-engine';

/**
 * Genera el contenido físico (textos, imágenes) apoyándose en la IA.
 */
export class AssetEngine {
  constructor(private ai: AIAdapter) {}

  public async generateAssets(
    pieces: ContentPiece[], 
    enrichment: CampaignContextEnrichment
  ): Promise<Artifact[]> {
    console.log(`[Media Engine: Asset] Generando ${pieces.length} piezas de contenido...`);
    
    const artifacts: Artifact[] = [];

    for (const piece of pieces) {
      // 1. Generar texto (Copy)
      const prompt = `Write a ${piece.format} post for ${piece.platform} about ${piece.topic}. Tone: ${enrichment.recommendedTone}`;
      const textRes = await this.ai.generateText(prompt);
      
      artifacts.push({
        id: `art_text_${piece.id}`,
        type: 'MARKDOWN',
        name: `Copy for ${piece.platform}`,
        content: textRes.content,
        metadata: { platform: piece.platform, generatedBy: textRes.metadata?.model },
        createdAt: new Date().toISOString()
      });

      // 2. Generar imagen si aplica (ej. X o Instagram)
      if (['X', 'Instagram', 'Telegram'].includes(piece.platform || '')) {
        const imgPrompt = `A visually striking image representing ${piece.topic}`;
        const imgRes = await this.ai.generateImage(imgPrompt);

        artifacts.push({
          id: `art_img_${piece.id}`,
          type: 'IMAGE',
          name: `Image for ${piece.platform}`,
          content: imgRes.content, // URL de la imagen
          metadata: { platform: piece.platform, generatedBy: imgRes.metadata?.model },
          createdAt: new Date().toISOString()
        });
      }
    }

    return artifacts;
  }
}
