import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { nexusActionRequests, nexusCollaborators, users, purchases, auditLogs, hermesConversations, hermesEscalations, nexusCampaignProposals } from '@/db/schema';
import { NexusTeamTransport } from './telegram-team-transport';
import { resolveEffectivePermissions, NexusRole, NexusPermissions } from './nexus-rbac';
import { DemandDistributionService } from '@/lib/hermes/demand/demand-distribution.service';

export interface ActionPayload {
  [key: string]: any;
}

/**
 * Maps each action type to its required server-derived capabilities and handlers.
 * This guarantees that capabilities are NEVER decided by the client request.
 */
interface PolicyDefinition {
  requiredCapability: keyof NexusPermissions;
  description: string;
}

const ACTION_POLICY: Record<string, PolicyDefinition> = {
  'APPROVE_KYC': {
    requiredCapability: 'compliance.manage',
    description: 'Aprobación de KYC de usuario'
  },
  'REJECT_KYC': {
    requiredCapability: 'compliance.manage',
    description: 'Rechazo de KYC de usuario'
  },
  'DEPOSIT_APPROVE': {
    requiredCapability: 'finance.manage',
    description: 'Aprobación de depósito manual'
  },
  'DEPOSIT_REJECT': {
    requiredCapability: 'finance.manage',
    description: 'Rechazo de depósito manual'
  },
  'HERMES_TAKEOVER': {
    requiredCapability: 'nexus.manage', // Ops/Support context
    description: 'Toma de control de conversación Hermes'
  },
  'CAMPAIGN_AUTHORIZE': {
    requiredCapability: 'growth.manage',
    description: 'Autorización y distribución de campaña de Demand'
  },
  'CAMPAIGN_REJECT': {
    requiredCapability: 'growth.manage',
    description: 'Rechazo de propuesta de campaña'
  }
};

/**
 * Domain command handlers to execute the real domain mutations.
 */
const ACTION_HANDLERS: Record<string, (payload: ActionPayload, context: any) => Promise<string>> = {
  'APPROVE_KYC': async (payload, { collaborator }) => {
    const userId = payload.userId as string;
    if (!userId) throw new Error("Missing userId");

    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ kycCompleted: true, kycLevel: 'verified' })
        .where(eq(users.id, userId));
        
      await tx.insert(auditLogs).values({
        event: 'APPROVE_KYC',
        category: 'nexus_tma',
        ip: 'system',
        success: true,
        metadata: { source: 'nexus_tma', actorId: collaborator.id.toString(), targetResource: `user:${userId}` }
      });
    });

    return `✅ KYC Aprobado para el usuario ${userId}`;
  },
  'REJECT_KYC': async (payload, { collaborator }) => {
    const userId = payload.userId as string;
    if (!userId) throw new Error("Missing userId");

    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ kycCompleted: false, kycLevel: 'rejected' })
        .where(eq(users.id, userId));
        
      await tx.insert(auditLogs).values({
        event: 'REJECT_KYC',
        category: 'nexus_tma',
        ip: 'system',
        success: true,
        metadata: { source: 'nexus_tma', actorId: collaborator.id.toString(), targetResource: `user:${userId}` }
      });
    });

    return `🚫 KYC Rechazado para el usuario ${userId}`;
  },
  'DEPOSIT_APPROVE': async (payload, { collaborator }) => {
    const purchaseId = payload.purchaseId as string;
    if (!purchaseId) throw new Error("Missing purchaseId");

    await db.transaction(async (tx) => {
      await tx.update(purchases)
        .set({ status: 'completed' })
        .where(eq(purchases.id, purchaseId));
        
      await tx.insert(auditLogs).values({
        event: 'DEPOSIT_APPROVE',
        category: 'nexus_tma',
        ip: 'system',
        success: true,
        metadata: { source: 'nexus_tma', actorId: collaborator.id.toString(), targetResource: `purchase:${purchaseId}` }
      });
    });

    return `✅ Depósito Aprobado para compra ${purchaseId}`;
  },
  'DEPOSIT_REJECT': async (payload, { collaborator }) => {
    const purchaseId = payload.purchaseId as string;
    if (!purchaseId) throw new Error("Missing purchaseId");

    await db.transaction(async (tx) => {
      await tx.update(purchases)
        .set({ status: 'rejected' }) // Or 'failed' depending on schema
        .where(eq(purchases.id, purchaseId));
        
      await tx.insert(auditLogs).values({
        event: 'DEPOSIT_REJECT',
        category: 'nexus_tma',
        ip: 'system',
        success: true,
        metadata: { source: 'nexus_tma', actorId: collaborator.id.toString(), targetResource: `purchase:${purchaseId}` }
      });
    });

    return `🚫 Depósito Rechazado para compra ${purchaseId}`;
  },
  'HERMES_TAKEOVER': async (payload, { collaborator }) => {
    const chatId = payload.chatId as string;
    const organizationId = (payload.organizationId || payload.canonicalOrgId || 'pandoras') as string;
    if (!chatId) throw new Error("Missing chatId");

    await db.transaction(async (tx) => {
      // 1. Pause Hermes on this conversation (upsert-like: update if exists)
      const [conv] = await tx
        .select({ id: hermesConversations.id, version: hermesConversations.version })
        .from(hermesConversations)
        .where(eq(hermesConversations.conversationId, chatId))
        .limit(1);

      if (conv) {
        await tx.update(hermesConversations)
          .set({
            status: 'PAUSED_HUMAN',
            escalationReason: 'MANUAL',
            assignedCollaboratorId: collaborator.id,
            escalatedAt: new Date(),
            version: conv.version + 1,
          })
          .where(eq(hermesConversations.id, conv.id));
      }

      // 2. Update any PENDING escalation to IN_PROGRESS
      await tx.update(hermesEscalations)
        .set({
          status: 'IN_PROGRESS',
          actorId: collaborator.id.toString(),
        })
        .where(
          and(
            eq(hermesEscalations.conversationId, chatId),
            eq(hermesEscalations.status, 'PENDING')
          )
        );

      // 3. Audit the takeover action
      await tx.insert(auditLogs).values({
        event: 'HERMES_TAKEOVER',
        category: 'nexus_tma',
        ip: 'system',
        success: true,
        metadata: {
          source: 'nexus_tma',
          actorId: collaborator.id.toString(),
          targetResource: `chat:${chatId}`,
          organizationId,
        }
      });
    });

    return `🧠 Control de Hermes asumido para chat ${chatId}. Bot pausado, tú tienes el control.`;
  },
  'CAMPAIGN_AUTHORIZE': async (payload, { collaborator }) => {
    const campaignId = payload.campaignId as string;
    const canonicalOrgId = payload.canonicalOrgId as string;
    if (!campaignId) throw new Error("Missing campaignId");

    // Retrieve proposal
    const [proposal] = await db.select().from(nexusCampaignProposals).where(eq(nexusCampaignProposals.id, campaignId)).limit(1);
    
    if (!proposal || proposal.canonicalOrgId !== canonicalOrgId) {
      throw new Error("Campaña no encontrada o acceso denegado");
    }

    if (proposal.status !== 'CONTENT_READY' && proposal.status !== 'PROPOSED') {
      throw new Error(`La campaña no está lista para ser autorizada (${proposal.status})`);
    }

    let dispatchedChannels = 0;
    try {
      // Try to dispatch via memory service (best effort, throws if not found)
      const result = await DemandDistributionService.approveAndDistribute(canonicalOrgId, proposal.externalCampaignId || campaignId);
      dispatchedChannels = result.dispatchedChannels?.length || 0;
    } catch (e: any) {
      console.warn('[NexusActionDispatcher] DemandDistributionService dispatch skipped/failed:', e.message);
      // We continue to update DB status even if memory service fails (resilience)
    }

    await db.transaction(async (tx) => {
      // Update proposal state
      await tx.update(nexusCampaignProposals).set({
        status: 'DISPATCHING',
        approvedBy: collaborator.id,
        approvedAt: new Date(),
        idempotencyKey: `idem_${canonicalOrgId}_${campaignId}`,
      }).where(eq(nexusCampaignProposals.id, campaignId));

      await tx.insert(auditLogs).values({
        event: 'CAMPAIGN_AUTHORIZE',
        category: 'nexus_tma',
        ip: 'system',
        success: true,
        metadata: { source: 'nexus_tma', actorId: collaborator.id.toString(), targetResource: `campaign:${campaignId}` }
      });
    });

    return `🚀 Campaña aprobada y encolada para distribución.`;
  },
  'CAMPAIGN_REJECT': async (payload, { collaborator }) => {
    const campaignId = payload.campaignId as string;
    const canonicalOrgId = payload.canonicalOrgId as string;
    if (!campaignId) throw new Error("Missing campaignId");

    await db.transaction(async (tx) => {
      await tx.update(nexusCampaignProposals).set({
        status: 'REJECTED',
        rejectedBy: collaborator.id,
        rejectedAt: new Date(),
      }).where(eq(nexusCampaignProposals.id, campaignId));

      await tx.insert(auditLogs).values({
        event: 'CAMPAIGN_REJECT',
        category: 'nexus_tma',
        ip: 'system',
        success: true,
        metadata: { source: 'nexus_tma', actorId: collaborator.id.toString(), targetResource: `campaign:${campaignId}` }
      });
    });

    return `🚫 Campaña rechazada correctamente.`;
  }
};

export class NexusActionDispatcher {
  constructor(private transport: NexusTeamTransport) {}

  /**
   * Registers a new action request in the database and returns a callback token.
   * Derives requiredCapability entirely from the server ACTION_POLICY.
   */
  async createActionRequest(
    actionType: string,
    payload: ActionPayload,
    actorIdentityId: number,
    targetResource: string,
    canonicalOrgId?: string,
    ttlHours: number = 24
  ): Promise<string> {
    const policy = ACTION_POLICY[actionType];
    if (!policy) {
      throw new Error(`[NexusSecurity] Unregistered action type: ${actionType}`);
    }

    const actionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    
    await db.insert(nexusActionRequests).values({
      actionToken,
      actionType,
      targetResource,
      canonicalOrgId,
      actorIdentityId,
      requiredCapability: policy.requiredCapability,
      payload,
      status: 'PENDING',
      expiresAt,
    });

    return actionToken;
  }

  /**
   * Executes an action based on a callback token and the user's telegram ID.
   * Performs atomic consumption and capability-based authorization.
   */
  async executeAction(
    actionToken: string,
    telegramUserId: string,
    callbackQueryId: string
  ): Promise<void> {
    try {
      // 1. Verify Collaborator Identity
      const collaborator = await db.query.nexusCollaborators.findFirst({
        where: eq(nexusCollaborators.telegramUserId, telegramUserId),
      });

      if (!collaborator || collaborator.status !== 'ACTIVE') {
        await this.answer(callbackQueryId, '❌ No autorizado o inactivo.');
        return;
      }

      // 2. Fetch the Action Request
      const actionReq = await db.query.nexusActionRequests.findFirst({
        where: eq(nexusActionRequests.actionToken, actionToken),
      });

      if (!actionReq) {
        await this.answer(callbackQueryId, '❌ Acción no encontrada.');
        return;
      }

      // 3. Expiration Check
      if (new Date() > actionReq.expiresAt) {
        await this.answer(callbackQueryId, '❌ El token de acción ha expirado.');
        return;
      }

      // 4. Status Check
      if (actionReq.status !== 'PENDING') {
        await this.answer(callbackQueryId, `ℹ️ Esta acción ya fue procesada (${actionReq.status}).`);
        return;
      }

      // 5. Actor Binding Verification
      if (actionReq.actorIdentityId !== collaborator.id) {
        await this.answer(callbackQueryId, '❌ Acción asignada a otro operador.');
        return;
      }

      // 6. Capability Authorization Guard (Role ≠ Authority)
      const effectivePermissions = resolveEffectivePermissions(
        (collaborator.role as NexusRole) || 'VIEWER', 
        collaborator.permissions as Partial<Record<string, boolean>> | null
      );
      
      const reqCap = actionReq.requiredCapability as keyof NexusPermissions;
      if (!effectivePermissions[reqCap]) {
        console.warn(`[NexusSecurity] DENY: User ${collaborator.id} lacks capability ${reqCap}`);
        await this.answer(callbackQueryId, '❌ No tienes el capability requerido para esta acción.');
        return;
      }

      // 7. Atomic Consumption Lock
      const now = new Date();
      const updated = await db.update(nexusActionRequests)
        .set({ status: 'EXECUTING', consumedAt: now })
        .where(and(eq(nexusActionRequests.id, actionReq.id), eq(nexusActionRequests.status, 'PENDING')))
        .returning({ id: nexusActionRequests.id });
      
      if (!updated || updated.length === 0) {
        await this.answer(callbackQueryId, '❌ La acción ya está siendo procesada.');
        return;
      }

      // 8. Execute Domain Mutation
      let resultText = '';
      const handler = ACTION_HANDLERS[actionReq.actionType];
      
      if (handler) {
        try {
          resultText = await handler(actionReq.payload as ActionPayload, { collaborator });
          
          await db.update(nexusActionRequests)
            .set({ status: 'COMPLETED', completedAt: new Date(), result: resultText })
            .where(eq(nexusActionRequests.id, actionReq.id));
            
        } catch (domainError: any) {
          console.error(`[NexusSecurity] Domain mutation failed for ${actionReq.actionType}:`, domainError);
          await db.update(nexusActionRequests)
            .set({ status: 'FAILED', result: domainError.message || 'Error' })
            .where(eq(nexusActionRequests.id, actionReq.id));
          resultText = '❌ Error al ejecutar la transacción del dominio.';
        }
      } else {
        resultText = '❌ Handler no encontrado para la acción.';
      }

      // 9. Notify Success/Result
      await this.answer(callbackQueryId, resultText);

    } catch (error) {
      console.error('[NexusActionDispatcher] Critical execution error:', error);
      await this.answer(callbackQueryId, '❌ Error interno crítico.');
    }
  }

  private async answer(callbackQueryId: string, text: string) {
    try {
      await this.transport.answerCallbackQuery({
        callback_query_id: callbackQueryId,
        text,
        show_alert: true,
      });
    } catch (e) {
      console.error('[NexusActionDispatcher] Failed to send telegram callback answer', e);
    }
  }
}
