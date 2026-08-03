/**
 * 🔀 Pandora's Platform OS — Hermes Interaction Router
 * lib/hermes/interaction-router.ts
 *
 * Classifies user intent and determines confidence score & routing target.
 */

export type UserIntent =
  | 'SALES_INQUIRY'
  | 'APPOINTMENT_REQUEST'
  | 'SUPPORT_FAQ'
  | 'OBJECTION'
  | 'HUMAN_ESCALATION'
  | 'GENERAL_CHAT';

export interface RouteResult {
  intent: UserIntent;
  confidence: number; // 0 to 100
  requiresHuman: boolean;
  targetFlow: 'sales' | 'support' | 'appointment' | 'handoff' | 'faq';
  reason: string;
}

export class InteractionRouter {
  static route(userMessage: string, previousContext?: any): RouteResult {
    const text = userMessage.toLowerCase().trim();

    // 1. Explicit Human Escalation Detection
    const humanTriggers = ['hablar con humano', 'agente humano', 'persona real', 'quejas', 'soporte humano', 'hablar con alguien'];
    if (humanTriggers.some(t => text.includes(t))) {
      return {
        intent: 'HUMAN_ESCALATION',
        confidence: 95,
        requiresHuman: true,
        targetFlow: 'handoff',
        reason: 'Solicitud explícita de operador humano'
      };
    }

    // 2. Appointment Request Triggers
    const appointmentTriggers = ['cita', 'agendar', 'demostración', 'demo', 'reunión', 'agendes', 'horario disponible'];
    if (appointmentTriggers.some(t => text.includes(t))) {
      return {
        intent: 'APPOINTMENT_REQUEST',
        confidence: 90,
        requiresHuman: false,
        targetFlow: 'appointment',
        reason: 'Intención de agendamiento detectada'
      };
    }

    // 3. Sales / Pricing Triggers
    const salesTriggers = ['comprar', 'precio', 'costo', 'cotización', 'cuanto cuesta', 'pagar', 'descuento', 'planes', 'inversion'];
    if (salesTriggers.some(t => text.includes(t))) {
      return {
        intent: 'SALES_INQUIRY',
        confidence: 85,
        requiresHuman: false,
        targetFlow: 'sales',
        reason: 'Consulta comercial / ventas'
      };
    }

    // 4. Objection Triggers
    const objectionTriggers = ['caro', 'no confío', 'desconfío', 'riesgo', 'luego veo', 'tengo dudas'];
    if (objectionTriggers.some(t => text.includes(t))) {
      return {
        intent: 'OBJECTION',
        confidence: 80,
        requiresHuman: false,
        targetFlow: 'sales',
        reason: 'Manejo de objeción comercial'
      };
    }

    // Default: General FAQ
    return {
      intent: 'SUPPORT_FAQ',
      confidence: 75,
      requiresHuman: false,
      targetFlow: 'faq',
      reason: 'Consulta general de información / FAQ'
    };
  }
}
