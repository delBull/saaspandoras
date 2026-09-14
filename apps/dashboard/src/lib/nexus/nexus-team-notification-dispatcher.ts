import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { nexusCollaborators } from '@/db/schema';
import { NexusTeamTransport } from './telegram-team-transport';
import { NexusActionDispatcher, ActionPayload } from './nexus-action-dispatcher';
import { resolveEffectivePermissions, NexusRole, NexusPermissions } from './nexus-rbac';

export class NexusTeamNotificationDispatcher {
  private transport: NexusTeamTransport;
  private actionDispatcher: NexusActionDispatcher;

  constructor() {
    this.transport = new NexusTeamTransport();
    this.actionDispatcher = new NexusActionDispatcher(this.transport);
  }

  /**
   * Broadcasts a notification to all active collaborators with the required capability.
   * Generates a unique, actor-bound action token for each eligible collaborator.
   */
  async notifyTeam(
    message: string,
    requiredCapability: keyof NexusPermissions,
    actionConfig?: { actionType: string; targetResource: string; payload: ActionPayload; approveText?: string; rejectText?: string; canonicalOrgId?: string }
  ): Promise<void> {
    try {
      // 1. Fetch eligible collaborators
      const collaborators = await db.query.nexusCollaborators.findMany({
        where: eq(nexusCollaborators.status, 'ACTIVE'),
      });

      const eligibleCollaborators = collaborators.filter(c => {
        const effective = resolveEffectivePermissions(
          (c.role as NexusRole) || 'VIEWER', 
          c.permissions as Partial<Record<string, boolean>> | null
        );
        return Boolean(effective[requiredCapability]);
      });

      if (eligibleCollaborators.length === 0) {
        console.warn(`[NexusTeamNotification] No eligible collaborators found for capability ${requiredCapability}`);
        return;
      }

      // 2. Dispatch to all eligible collaborators, generating unique tokens per actor
      for (const collaborator of eligibleCollaborators) {
        if (!collaborator.telegramUserId) continue;

        let inline_keyboard: any[][] = [];
        if (actionConfig) {
          try {
            const approveToken = await this.actionDispatcher.createActionRequest(
              actionConfig.actionType + '_APPROVE',
              actionConfig.payload,
              collaborator.id,
              actionConfig.targetResource,
              actionConfig.canonicalOrgId,
              24 // TTL 24 hours
            );
            
            const rejectToken = await this.actionDispatcher.createActionRequest(
              actionConfig.actionType + '_REJECT',
              actionConfig.payload,
              collaborator.id,
              actionConfig.targetResource,
              actionConfig.canonicalOrgId,
              24
            );

            inline_keyboard = [[
              { text: `✅ ${actionConfig.approveText || 'Aprobar'}`, callback_data: approveToken },
              { text: `❌ ${actionConfig.rejectText || 'Rechazar'}`, callback_data: rejectToken }
            ]];
          } catch (tokenErr) {
            console.error(`[NexusTeamNotification] Failed to create action tokens for user ${collaborator.id}:`, tokenErr);
            continue; // Skip this user if we can't create tokens
          }
        }

        try {
          await this.transport.sendMessage({
            chat_id: parseInt(collaborator.telegramUserId, 10),
            text: message,
            parse_mode: 'HTML',
            reply_markup: inline_keyboard.length > 0 ? { inline_keyboard } : undefined,
          });
        } catch (err) {
          console.error(`[NexusTeamNotification] Failed to notify user ${collaborator.telegramUserId}:`, err);
        }
      }
    } catch (error) {
      console.error('[NexusTeamNotification] Global dispatch error:', error);
    }
  }

  /**
   * Dedicated method to notify about a new KYC/Deposit approval.
   */
  async notifyPendingApproval(projectId: string, amount: string, userName: string) {
    const text = `🏦 <b>Depósito Pendiente</b>\n\nEl usuario <b>${userName}</b> ha solicitado un depósito de <b>${amount}</b> para el proyecto <code>${projectId}</code>.\n\n¿Deseas aprobar esta transacción?`;
    
    await this.notifyTeam(text, 'finance.manage', {
      actionType: 'DEPOSIT',
      targetResource: `dep_${Date.now()}`, // Typically comes from real DB
      payload: { projectId, amount, userName },
      approveText: 'Aprobar Depósito',
      rejectText: 'Rechazar',
    });
  }

  /**
   * Dedicated method to notify Hermes HITL escalations.
   */
  async notifyHermesEscalation(chatId: string, summary: string) {
    const text = `🧠 <b>Hermes Escalation (HITL)</b>\n\nHermes ha escalado una conversación por frustración del usuario.\n\n<b>Resumen:</b> ${summary}`;
    
    await this.notifyTeam(text, 'nexus.manage', {
      actionType: 'HERMES',
      targetResource: chatId,
      payload: { chatId },
      approveText: 'Asumir Control',
      rejectText: 'Ignorar',
    });
  }
}
