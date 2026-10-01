import { db } from '@/db';
import { hermesJourneyStages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { HermesSkill } from './contracts';

export class HermesSkillResolver {
  
  /**
   * Translates a Journey Stage from the database into a Markdown-formatted HermesSkill.
   * K11-HITO-2: Dynamic Skill Loader for Journey Navigation
   * 
   * @param stageId The UUID of the hermesJourneyStage
   * @param organizationId To bind the skill to the tenant
   */
  static async resolveSkillForStage(stageId: string, organizationId: string): Promise<HermesSkill | null> {
    const stage = await db.query.hermesJourneyStages.findFirst({
      where: eq(hermesJourneyStages.id, stageId)
    });

    if (!stage) return null;

    const objectives = (stage.objectives as any[]) || [];
    
    // Construct the Instructions Markdown from the JSONB objectives
    const instructionsMarkdown = [
      `### Etapa Actual: ${stage.name}`,
      `**Objetivos a cumplir en esta etapa:**`,
      ...objectives.map((obj, i) => {
        const title = obj.name || obj.title || `Objetivo ${i + 1}`;
        const desc = obj.description ? `: ${obj.description}` : '';
        return `* [ ] **${title}**${desc}`;
      }),
      '',
      '> DIRECTIVA OPERATIVA: Guía al usuario conversacionalmente para cumplir estos objetivos. Una vez satisfechos, notifica que la etapa puede ser completada.'
    ].join('\n');

    return {
      id: `skill_stage_${stage.id}`,
      organizationId,
      key: `journey_stage_${stage.id}`,
      version: 1,
      name: stage.name,
      description: `Procedimientos para la etapa: ${stage.name}`,
      instructionsMarkdown
    };
  }
}
