/**
 * ⚡ Pandora's Platform OS — Hermes Capability Dispatcher
 * lib/hermes/capability-dispatcher.ts
 *
 * Decouples tool and service execution from the LLM.
 */

export interface DispatchRequest {
  capability: 'calendar.schedule' | 'crm.update_stage' | 'payments.create_spei_link' | 'tokenization.get_holdings';
  projectId: number;
  payload: Record<string, any>;
}

export interface DispatchResult {
  success: boolean;
  actionExecuted: string;
  data: any;
  userSummary: string;
}

export class CapabilityDispatcher {
  static async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const { capability, projectId, payload } = request;

    console.info(`[CapabilityDispatcher] Executing ${capability} for project ${projectId}`, payload);

    switch (capability) {
      case 'calendar.schedule':
        return {
          success: true,
          actionExecuted: 'calendar.schedule',
          data: { appointmentId: `apt_${Date.now()}`, slot: payload.requestedSlot || 'Sábado 11:00 AM' },
          userSummary: `Cita agendada tentativamente para ${payload.requestedSlot || 'el horario solicitado'}.`
        };

      case 'crm.update_stage':
        return {
          success: true,
          actionExecuted: 'crm.update_stage',
          data: { newStage: payload.stage || 'PROPOSAL' },
          userSummary: 'Etapa del CRM actualizada.'
        };

      case 'payments.create_spei_link':
        return {
          success: true,
          actionExecuted: 'payments.create_spei_link',
          data: { speiClabe: '646180111111111111', reference: `REF-${Date.now().toString(36).toUpperCase()}` },
          userSummary: 'Referencia SPEI Fast Lane generada.'
        };

      case 'tokenization.get_holdings':
        return {
          success: true,
          actionExecuted: 'tokenization.get_holdings',
          data: { project: 'S\'Narai', certificates: 2, votingPower: '2.5%' },
          userSummary: 'Holdings y poder de voto recuperados.'
        };

      default:
        return {
          success: false,
          actionExecuted: capability,
          data: null,
          userSummary: 'Capacidad no soportada o inactiva.'
        };
    }
  }
}
