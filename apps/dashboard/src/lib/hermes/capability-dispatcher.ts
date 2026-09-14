import { executionOS } from '@/lib/pandoras/composition/execution-composition';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';

/**
 * ⚡ Pandora's Platform OS — Hermes Capability Dispatcher
 * lib/hermes/capability-dispatcher.ts
 *
 * Decouples tool and service execution from the LLM.
 */

export interface DispatchRequest {
  capability: 'calendar.schedule' | 'crm.update_stage' | 'payments.create_spei_link' | 'tokenization.get_holdings' | 'support.escalate_human';
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

      case 'crm.update_stage': {
        try {
          // Resolver el canonicalOrgId server-side usando OrganizationSDK
          const orgContext = await OrganizationSDK.resolve(projectId, 'HERMES');

          const result = await executionOS.execute({
            capabilityId: 'CRM_UPDATE_STAGE',
            version: 'v1',
            input: { 
              leadId: String(payload.leadId),
              projectId: projectId, 
              stage: payload.stage 
            },
            context: {
              intentId: `hermes-chat-${Date.now()}`,
              organizationId: orgContext.organizationId,
              idempotencyKey: `hermes-chat-${Date.now()}`,
              actorId: 'system',
              missionId: 'none',
              correlationId: `hermes-chat-${Date.now()}`
            }
          });

          if (result.status === 'succeeded') {
            return {
              success: true,
              actionExecuted: 'crm.update_stage',
              data: result.data,
              userSummary: 'Etapa del CRM actualizada correctamente.'
            };
          } else {
            console.error(`[CapabilityDispatcher] CRM Update failed:`, result.error);
            return {
              success: false,
              actionExecuted: 'crm.update_stage',
              data: null,
              userSummary: `No se pudo actualizar la etapa: ${result.error?.message}`
            };
          }
        } catch (error: any) {
          console.error(`[CapabilityDispatcher] Exception executing CRM Update:`, error);
          return {
            success: false,
            actionExecuted: 'crm.update_stage',
            data: null,
            userSummary: 'Error de servidor al intentar actualizar el CRM.'
          };
        }
      }

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

      case 'support.escalate_human':
        return {
          success: true,
          actionExecuted: 'support.escalate_human',
          data: { conversationId: payload.conversationId },
          userSummary: 'Conversación escalada a un agente humano.'
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
