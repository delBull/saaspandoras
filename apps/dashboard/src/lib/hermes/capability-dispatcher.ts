import { executionOS } from '@/lib/pandoras/composition/execution-composition';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';

/**
 * ⚡ Pandora's Platform OS — Hermes Capability Dispatcher
 * lib/hermes/capability-dispatcher.ts
 *
 * Decouples tool and service execution from the LLM.
 */

export interface DispatchRequest {
  capability: 'calendar.schedule' | 'crm.update_stage' | 'payments.create_spei_link' | 'tokenization.get_holdings' | 'support.escalate_human' | 'manage_team.add_collaborator' | 'finance.approve_deposit' | 'compliance.approve_kyc' | 'deals.add_comment' | 'manage_team.telegram_invite' | 'project.approve_purchase' | 'project.distribute_yield' | 'project.update_treasury' | 'project.sync_dao' | 'knowledge.add_document';
  projectId: number;
  payload: Record<string, any>;
  actorId?: string; // The caller's identifier (WhatsApp phone, Telegram ID, or wallet)
}

export interface DispatchResult {
  success: boolean;
  actionExecuted: string;
  data: any;
  userSummary: string;
}

export class CapabilityDispatcher {
  static async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const { capability, projectId, payload, actorId } = request;

    console.info(`[CapabilityDispatcher] Executing ${capability} for project ${projectId}`, payload);

    // 🔒 C5.19: Super Admin Security Check
    const superAdminCapabilities = [
      'manage_team.add_collaborator',
      'finance.approve_deposit',
      'compliance.approve_kyc',
      'deals.add_comment',
      'manage_team.telegram_invite',
      'project.approve_purchase',
      'project.distribute_yield',
      'project.update_treasury',
      'project.sync_dao',
      'knowledge.add_document'
    ];

    if (superAdminCapabilities.includes(capability)) {
      if (!actorId) {
        return { success: false, actionExecuted: capability, data: null, userSummary: '🔒 Bloqueado: No se pudo verificar tu identidad.' };
      }
      
      const authorizedAdmins = (process.env.SUPERADMIN_IDENTIFIERS || '').split(',');
      const isSuperAdmin = authorizedAdmins.includes(actorId) || await this.verifySuperAdminInDB(actorId);
      
      if (!isSuperAdmin) {
        console.warn(`[SECURITY BREACH] Attempt to execute ${capability} by unauthorized actor: ${actorId}`);
        return { success: false, actionExecuted: capability, data: null, userSummary: '🔒 Acceso Denegado: Esta capacidad está restringida a Super Administradores.' };
      }
    }

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

      case 'manage_team.add_collaborator':
        return { success: true, actionExecuted: capability, data: { email: payload.email, role: payload.role }, userSummary: `Invitación enviada a ${payload.email} exitosamente.` };

      case 'finance.approve_deposit':
        return { success: true, actionExecuted: capability, data: { depositId: payload.depositId }, userSummary: `Depósito ${payload.depositId || ''} aprobado en la tesorería.` };

      case 'compliance.approve_kyc':
        return { success: true, actionExecuted: capability, data: { userId: payload.userId }, userSummary: `KYC aprobado. El usuario ya puede invertir.` };

      case 'deals.add_comment':
        return { success: true, actionExecuted: capability, data: { roomId: payload.roomId }, userSummary: `Comentario/Resumen añadido al Deal Room.` };

      case 'manage_team.telegram_invite':
        return { success: true, actionExecuted: capability, data: { url: 'https://t.me/+mock_invite' }, userSummary: `Enlace de invitación seguro generado.` };

      case 'project.approve_purchase':
        return { success: true, actionExecuted: capability, data: { purchaseId: payload.purchaseId }, userSummary: `Compra de RWA aprobada. Certificados en proceso de emisión on-chain.` };

      case 'project.distribute_yield':
        return { success: true, actionExecuted: capability, data: { txHash: '0xmock' }, userSummary: `Rendimientos distribuidos masivamente a la DAO.` };

      case 'project.update_treasury':
        return { success: true, actionExecuted: capability, data: { balances: 'updated' }, userSummary: `Sincronización de tesorería completada.` };

      case 'project.sync_dao':
        return { success: true, actionExecuted: capability, data: { members: 'synced' }, userSummary: `Padrón de la DAO sincronizado con los contratos inteligentes.` };

      case 'knowledge.add_document':
        return { success: true, actionExecuted: capability, data: { documentId: payload.documentId }, userSummary: `Documento inyectado en la bóveda K25 del proyecto.` };

      default:
        return {
          success: false,
          actionExecuted: capability,
          data: null,
          userSummary: 'Capacidad no soportada o inactiva.'
        };
    }
  }

  // Helper method to verify against administrators table if env var is missing
  private static async verifySuperAdminInDB(actorId: string): Promise<boolean> {
    try {
      const { db } = await import('@/db');
      const { administrators } = await import('@/db/schema');
      const { eq, or } = await import('drizzle-orm');
      
      const admin = await db.query.administrators.findFirst({
        where: or(
          eq(administrators.walletAddress, actorId),
          eq(administrators.alias, actorId) // Fallback for phone numbers mapped to alias
        )
      });
      return !!admin && (admin.role === 'admin' || admin.role === 'superadmin');
    } catch {
      return false; // Fail closed
    }
  }
}
