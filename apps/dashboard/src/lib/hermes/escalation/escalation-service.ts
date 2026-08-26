import { db } from '@/db';
import { hermesConversations, hermesEscalations, hermesConversationMessages } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export type EscalationReason = 'FRUSTRATION' | 'USER_REQUEST' | 'POLICY_VIOLATION' | 'KNOWLEDGE_GAP' | 'MANUAL';
export type EscalationStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
export type ChannelType = 'TELEGRAM' | 'WHATSAPP' | 'WEB' | 'API';

export interface TriggerEscalationParams {
  organizationId: string;
  conversationId: string;
  actorId?: string;
  channel?: ChannelType;
  reason: EscalationReason;
  notes?: string;
}

export interface HumanReplyParams {
  organizationId: string;
  escalationId: string;
  content: string;
  operatorId: string;
}

export interface ResumeHermesParams {
  organizationId: string;
  escalationId: string;
  operatorId: string;
  notes?: string;
}

export class EscalationService {
  /**
   * Dispara una escalación a humano, pausando la conversación de Hermes y registrando el evento.
   */
  static async triggerEscalation(params: TriggerEscalationParams) {
    const { organizationId, conversationId, actorId, channel = 'TELEGRAM', reason, notes } = params;

    // 1. Pausar la conversación en hermesConversations
    await db
      .update(hermesConversations)
      .set({
        status: 'PAUSED_HUMAN',
        escalationReason: reason,
        escalatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(hermesConversations.organizationId, organizationId),
          eq(hermesConversations.conversationId, conversationId)
        )
      );

    // 2. Crear el registro en hermesEscalations
    const [escalation] = await db
      .insert(hermesEscalations)
      .values({
        organizationId,
        conversationId,
        actorId: actorId || 'anonymous_lead',
        channel,
        reason,
        status: 'PENDING',
        notes,
      })
      .returning();

    // 3. Registrar auditoría de seguridad / gobernanza (best-effort, non-blocking)
    try {
      // hermesSecurityEvents requires hash-chain fields — skip audit for now;
      // escalation record itself is the audit trail.
      console.log(`[EscalationService] Escalation triggered: ${escalation!.id} org=${organizationId} reason=${reason}`);
    } catch (e) {
      console.warn('Failed to record escalation audit event:', e);
    }

    if (!escalation) {
      throw new Error(`Failed to create escalation for conversation ${conversationId}`);
    }

    return escalation;
  }

  /**
   * Obtiene la lista de escalaciones de un tenant.
   */
  static async getEscalations(organizationId: string, status?: EscalationStatus) {
    const conditions = [eq(hermesEscalations.organizationId, organizationId)];
    if (status) {
      conditions.push(eq(hermesEscalations.status, status));
    }

    return db
      .select()
      .from(hermesEscalations)
      .where(and(...conditions))
      .orderBy(desc(hermesEscalations.createdAt));
  }

  /**
   * Obtiene el detalle de una escalación con sus mensajes históricos.
   */
  static async getEscalationDetails(organizationId: string, escalationId: string) {
    const [escalation] = await db
      .select()
      .from(hermesEscalations)
      .where(
        and(
          eq(hermesEscalations.organizationId, organizationId),
          eq(hermesEscalations.id, escalationId)
        )
      );

    if (!escalation) {
      throw new Error(`Escalation ${escalationId} not found for tenant ${organizationId}`);
    }

    const messages = await db
      .select()
      .from(hermesConversationMessages)
      .where(
        and(
          eq(hermesConversationMessages.organizationId, organizationId),
          eq(hermesConversationMessages.conversationId, escalation.conversationId)
        )
      )
      .orderBy(hermesConversationMessages.sequence);

    return {
      escalation,
      messages,
    };
  }

  /**
   * Permite al operador responder en la conversación mientras está pausada.
   */
  static async replyAsHuman(params: HumanReplyParams) {
    const { organizationId, escalationId, content, operatorId } = params;

    const [escalation] = await db
      .select()
      .from(hermesEscalations)
      .where(
        and(
          eq(hermesEscalations.organizationId, organizationId),
          eq(hermesEscalations.id, escalationId)
        )
      );

    if (!escalation) {
      throw new Error(`Escalation ${escalationId} not found`);
    }

    // Obtener la siguiente secuencia
    const existingMessages = await db
      .select()
      .from(hermesConversationMessages)
      .where(
        and(
          eq(hermesConversationMessages.organizationId, organizationId),
          eq(hermesConversationMessages.conversationId, escalation.conversationId)
        )
      )
      .orderBy(desc(hermesConversationMessages.sequence))
      .limit(1);

    const nextSeq = existingMessages.length > 0 ? (existingMessages[0]!.sequence + 1) : 1;

    // Insertar el mensaje del operador
    const [message] = await db
      .insert(hermesConversationMessages)
      .values({
        id: uuidv4(),
        organizationId,
        conversationId: escalation.conversationId,
        role: 'OPERATOR',
        content,
        sequence: nextSeq,
        idempotencyKey: `op_msg_${Date.now()}_${uuidv4().slice(0, 8)}`,
      })
      .returning();

    // Actualizar estado de la escalación a IN_PROGRESS
    if (escalation.status === 'PENDING') {
      await db
        .update(hermesEscalations)
        .set({
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
        })
        .where(eq(hermesEscalations.id, escalationId));
    }

    if (!message) {
      throw new Error('Failed to insert operator message');
    }

    return message;
  }

  /**
   * Devuelve el control autónomo a Hermes y marca la escalación como resuelta.
   */
  static async resumeHermes(params: ResumeHermesParams) {
    const { organizationId, escalationId, operatorId, notes } = params;

    const [escalation] = await db
      .select()
      .from(hermesEscalations)
      .where(
        and(
          eq(hermesEscalations.organizationId, organizationId),
          eq(hermesEscalations.id, escalationId)
        )
      );

    if (!escalation) {
      throw new Error(`Escalation ${escalationId} not found`);
    }

    // 1. Reactivar la conversación
    await db
      .update(hermesConversations)
      .set({
        status: 'ACTIVE',
        escalationReason: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(hermesConversations.organizationId, organizationId),
          eq(hermesConversations.conversationId, escalation.conversationId)
        )
      );

    // 2. Marcar la escalación como resuelta
    const [updatedEscalation] = await db
      .update(hermesEscalations)
      .set({
        status: 'RESOLVED',
        resolvedBy: operatorId,
        resolvedAt: new Date(),
        notes: notes ? `${escalation.notes || ''}\n${notes}`.trim() : escalation.notes,
        updatedAt: new Date(),
      })
      .where(eq(hermesEscalations.id, escalationId))
      .returning();

    // 3. Registrar mensaje del sistema en la conversación
    try {
      const existing = await db
        .select()
        .from(hermesConversationMessages)
        .where(
          and(
            eq(hermesConversationMessages.organizationId, organizationId),
            eq(hermesConversationMessages.conversationId, escalation.conversationId)
          )
        )
        .orderBy(desc(hermesConversationMessages.sequence))
        .limit(1);

      const nextSeq = existing.length > 0 ? (existing[0]!.sequence + 1) : 1;

      await db.insert(hermesConversationMessages).values({
        id: uuidv4(),
        organizationId,
        conversationId: escalation.conversationId,
        role: 'SYSTEM',
        content: `Operator ${operatorId} resumed autonomous control.`,
        sequence: nextSeq,
        idempotencyKey: `system_resume_${Date.now()}_${uuidv4().slice(0, 8)}`,
      });
    } catch (e) {
      console.warn('Failed to insert system resume message:', e);
    }

    if (!updatedEscalation) {
      throw new Error(`Failed to update escalation ${escalationId}`);
    }
    return updatedEscalation;
  }
}
