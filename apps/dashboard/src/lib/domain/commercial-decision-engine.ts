import { db } from '@/db';
import { marketingLeadEvents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { DecisionDTO, LeadActivityDTO } from './dto';

export class CommercialDecisionEngine {
  /**
   * Generates a recommended sales strategy (playbook/decision) for a given context.
   * In the future, this can be powered by AI and the ambassador's current pipeline.
   * For now, it returns the standard optimized decisions dynamically.
   */
  static async getDecisions(projectId: number, ambassadorId: string): Promise<DecisionDTO[]> {
    // Currently, we return static strategic decisions.
    // Future iteration: Query pipeline temperature and generate dynamic playbooks.
    return [
      {
        id: 'rec_sweet_spot',
        title: 'Fracción Inversionista',
        subtitle: '1. El Producto Core',
        description: '$25,000 USD (500 Títulos)',
        benefits: ['Nivel Embajador (+5% Yield)', '10 Noches de Estancia Anual', 'Cierre rápido (sin hipoteca)'],
        commissionRate: '4%',
        estimatedCommission: '$1,000 USD',
        iconType: 'trending'
      },
      {
        id: 'rec_high_ticket',
        title: 'Unidad Integral',
        subtitle: '2. El Ticket Alto',
        description: '$100,000+ USD (2000 Títulos)',
        benefits: ['Estatus Riviera Owner', 'Gobernanza Total', 'Escrituración 100% digital'],
        commissionRate: '4%',
        estimatedCommission: '$4,000 USD',
        iconType: 'high_ticket'
      },
      {
        id: 'rec_fast_close',
        title: 'Paquete Vacacional',
        subtitle: '3. El Cierre Rápido',
        description: '$2,500 USD (50 Títulos)',
        benefits: ['Nivel Residente (+1% Yield)', '4 Noches de Estancia Anual', 'Ideal para volumen por WhatsApp'],
        commissionRate: '4%',
        estimatedCommission: '$100 USD',
        iconType: 'fast_close'
      }
    ];
  }

  /**
   * Builds the chronological activity stream of events for a specific lead.
   */
  static async getActivityStream(leadId: string): Promise<LeadActivityDTO[]> {
    const events = await db.select()
      .from(marketingLeadEvents)
      .where(eq(marketingLeadEvents.leadId, leadId))
      .orderBy(desc(marketingLeadEvents.createdAt));

    return events.map(e => {
      let description = "Actividad registrada";
      
      // Basic human-readable translation of raw events
      switch (e.type) {
        case 'signup':
          description = "Prospecto registrado en la plataforma";
          break;
        case 'view_deck':
          description = "Abrió el Deck de Inversión";
          break;
        case 'click_calculator':
          description = "Utilizó la Calculadora de Rendimientos";
          break;
        case 'schedule_meeting':
          description = "Agendó videollamada de Due Diligence";
          break;
        default:
          description = `Acción: ${e.type}`;
      }

      return {
        id: e.id,
        type: e.type,
        description,
        timestamp: (e.createdAt || new Date()).toISOString(),
        metadata: e.payload
      };
    });
  }
}
