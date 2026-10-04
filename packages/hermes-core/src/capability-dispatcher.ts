import { getExecutionOSPort } from "./ports";
import { OrganizationSDK } from '@saasfly/shared';

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
      case 'crm.update_stage': {
        try {
          // Resolver el canonicalOrgId server-side usando OrganizationSDK
          const orgContext = await OrganizationSDK.resolve(projectId, 'HERMES');

          const execOS = getExecutionOSPort();
          const result = await execOS.execute({
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

          if ((result as any).status === 'succeeded') {
            return {
              success: true,
              actionExecuted: 'crm.update_stage',
              data: (result as any).data,
              userSummary: 'Etapa del CRM actualizada correctamente.'
            };
          } else {
            console.error(`[CapabilityDispatcher] CRM Update failed:`, (result as any).error);
            return {
              success: false,
              actionExecuted: 'crm.update_stage',
              data: null,
              userSummary: `No se pudo actualizar la etapa: ${(result as any).error?.message}`
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

      default:
        throw new Error(`NOT_CONFIGURED: Capability '${capability}' is not yet implemented or wired to ExecutionOS.`);
    }
    }
  }

  // Helper method to verify against administrators table if env var is missing
  private static async verifySuperAdminInDB(actorId: string): Promise<boolean> {
    try {
      const { db } = await import('@saasfly/db-core');
      const { administrators } = await import('@saasfly/db-core/schema');
      const { eq, or } = await import('@saasfly/db-core');
      
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
