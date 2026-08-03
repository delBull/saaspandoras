/**
 * 🎓 Pandora's Platform OS — Skill Registry
 * lib/hermes/skill-registry.ts
 *
 * Reusable business procedures per industry/vertical.
 */

export interface SkillDefinition {
  id: string;
  name: string;
  industry: string;
  steps: string[];
  requiredTools: string[];
}

export class SkillRegistry {
  private static skills: Map<string, SkillDefinition> = new Map([
    [
      'real_estate.qualify_buyer',
      {
        id: 'real_estate.qualify_buyer',
        name: 'Calificar Comprador Patrimonial',
        industry: 'Real Estate',
        steps: ['Identificar presupuesto', 'Verificar forma de pago (SPEI/Financiamiento)', 'Agendar recorrido o reunión'],
        requiredTools: ['crm.update_stage', 'calendar.schedule'],
      },
    ],
    [
      'snarai.buy_certificate',
      {
        id: 'snarai.buy_certificate',
        name: 'Adquisición de Certificado S\'Narai',
        industry: 'Tokenización RWA',
        steps: ['Consultar disponibilidad', 'Generar CLABE SPEI Fast Lane', 'Confirmar acreditación de tokens'],
        requiredTools: ['payments.create_spei_link', 'tokenization.get_holdings'],
      },
    ],
    [
      'health.schedule_cleaning',
      {
        id: 'health.schedule_cleaning',
        name: 'Agendar Cita Médica / Consulta',
        industry: 'Salud',
        steps: ['Validar especialidad', 'Verificar disponibilidad', 'Confirmar cita'],
        requiredTools: ['calendar.schedule'],
      },
    ],
  ]);

  static get(skillId: string): SkillDefinition | undefined {
    return this.skills.get(skillId);
  }

  static listForIndustry(industry: string): SkillDefinition[] {
    return Array.from(this.skills.values()).filter(s => s.industry.toLowerCase() === industry.toLowerCase());
  }
}
