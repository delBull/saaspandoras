import { sql } from "@/lib/database"; // Usar el connection pool actual
import { eq, and } from "drizzle-orm";
import { whatsappUsers, whatsappSessions, whatsappMessages } from "@/db/schema";
import type { WhatsAppQuestionId } from './flowConfig';
import type { WhatsAppUser, WhatsAppSession, WhatsAppMessage } from "@/db/schema";

export interface PreapplyLeadState {
  id: number;
  userPhone: string;
  step: number;
  status: string;
  answers: Record<WhatsAppQuestionId, any>;
  applicantName?: string;
  applicantEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============
// SISTEMA LEGACY DE PREAPPLY (8 QUESTIONS)
// ============

/**
 * Obtener o crear estado inicial para un lead de pre-apply
 */
export async function getOrCreatePreapplyLead(userPhone: string): Promise<PreapplyLeadState | null> {
  try {
    const existing = await sql`
      SELECT id, user_phone, step, status, answers, applicant_name, applicant_email, created_at, updated_at
      FROM whatsapp_preapply_leads
      WHERE user_phone = ${userPhone}
      LIMIT 1
    ` as any[];

    if (existing.length > 0 && existing[0]) {
      const row = existing[0];
      return {
        id: row.id,
        userPhone: row.user_phone,
        step: row.step,
        status: row.status,
        answers: row.answers || {},
        applicantName: row.applicant_name,
        applicantEmail: row.applicant_email,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    }

    const newLead = await sql`
      INSERT INTO whatsapp_preapply_leads (user_phone)
      VALUES (${userPhone})
      RETURNING id, user_phone, step, status, answers, applicant_name, applicant_email, created_at, updated_at
    ` as any[];

    if (newLead.length === 0 || !newLead[0]) return null;

    const row = newLead[0];
    return {
      id: row.id,
      userPhone: row.user_phone,
      step: row.step,
      status: row.status,
      answers: row.answers || {},
      applicantName: row.applicant_name,
      applicantEmail: row.applicant_email,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  } catch (error) {
    console.error('Error en getOrCreatePreapplyLead:', error);
    return null;
  }
}

/**
 * Guardar respuesta a una pregunta
 */
export async function savePreapplyAnswer(leadId: number, questionId: WhatsAppQuestionId, answer: any, applicantName?: string, applicantEmail?: string): Promise<boolean> {
  try {
    const setExpressions = [
      `answers = jsonb_set(answers, '{${questionId}}', '${JSON.stringify(answer)}'::jsonb)`,
      `updated_at = now()`
    ];

    if (applicantName) setExpressions.push(`applicant_name = '${applicantName.replace(/'/g, "''")}'`);
    if (applicantEmail) setExpressions.push(`applicant_email = '${applicantEmail.replace(/'/g, "''")}'`);

    const query = `UPDATE whatsapp_preapply_leads SET ${setExpressions.join(', ')} WHERE id = ${leadId}`;
    await sql.unsafe(query);

    return true;
  } catch (error) {
    console.error('Error en savePreapplyAnswer:', error);
    return false;
  }
}

export async function advancePreapplyStep(leadId: number): Promise<boolean> {
  try {
    await sql`UPDATE whatsapp_preapply_leads SET step = step + 1, updated_at = now() WHERE id = ${leadId}`;
    return true;
  } catch (error) {
    console.error('Error en advancePreapplyStep:', error);
    return false;
  }
}

export async function markPreapplyCompleted(leadId: number, status: 'completed' | 'pending' = 'completed'): Promise<boolean> {
  try {
    await sql`UPDATE whatsapp_preapply_leads SET status = ${status}, updated_at = now() WHERE id = ${leadId}`;
    return true;
  } catch (error) {
    console.error('Error en markPreapplyCompleted:', error);
    return false;
  }
}

export async function getAllPreapplyLeads(): Promise<PreapplyLeadState[]> {
  try {
    const results = await sql`
      SELECT id, user_phone, step, status, answers, applicant_name, applicant_email, created_at, updated_at
      FROM whatsapp_preapply_leads
      ORDER BY created_at DESC
    `;

    return results.map(row => ({
      id: row.id,
      userPhone: row.user_phone,
      step: row.step,
      status: row.status,
      answers: row.answers || {},
      applicantName: row.applicant_name,
      applicantEmail: row.applicant_email,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  } catch (error) {
    console.error('Error en getAllPreapplyLeads:', error);
    return [];
  }
}

// ============
// SISTEMA MULTI-FLOW INTEGRADO
// ============

/**
 * Create or find WhatsApp user by phone
 */
export async function upsertWhatsAppUser(phone: string, name?: string): Promise<WhatsAppUser> {
  const existingUsers = await sql`
    SELECT * FROM whatsapp_users WHERE phone = ${phone} LIMIT 1
  ` as any[];

  if (existingUsers.length > 0) {
    const existing = existingUsers[0];
    if (name && existing.name !== name) {
      await sql`UPDATE whatsapp_users SET name = ${name}, updated_at = now() WHERE id = ${existing.id}`;
    }
    return existing;
  }

  const newUsers = await sql`
    INSERT INTO whatsapp_users (phone, name, priority_level)
    VALUES (${phone}, ${name || null}, 'normal')
    RETURNING *
  ` as any[];

  if (newUsers.length === 0) throw new Error(`Failed to create user for phone: ${phone}`);
  return newUsers[0];
}

/**
 * Get or create active session for user - SOPORTA CAMBIO DE FLOWS
 */
export async function getOrCreateActiveSession(userId: string, flowType = "eight_q"): Promise<WhatsAppSession> {
  // Buscar sesión activa del MISMO tipo de flow
  const [existingSameFlow] = await sql`
    SELECT * FROM whatsapp_sessions
    WHERE user_id = ${userId} AND flow_type = ${flowType} AND is_active = true
    LIMIT 1
  ` as any[];

  if (existingSameFlow) return existingSameFlow;

  // Cerrar cualquier sesión activa diferente
  await sql`
    UPDATE whatsapp_sessions
    SET is_active = false, updated_at = now()
    WHERE user_id = ${userId} AND is_active = true
  `;

  // Buscar sesión inactiva del mismo flow para reactivar
  const [existingInactive] = await sql`
    SELECT * FROM whatsapp_sessions
    WHERE user_id = ${userId} AND flow_type = ${flowType} AND is_active = false
    ORDER BY updated_at DESC
    LIMIT 1
  ` as any[];

  if (existingInactive) {
    await sql`
      UPDATE whatsapp_sessions
      SET is_active = true, current_step = 0, state = '{}', updated_at = now()
      WHERE id = ${existingInactive.id}
    `;
    return { ...existingInactive, is_active: true, current_step: 0, state: {} };
  }

  // Crear nueva sesión
  const newSessions = await sql`
    INSERT INTO whatsapp_sessions (user_id, flow_type, state, current_step, is_active)
    VALUES (${userId}, ${flowType}, '{}', 0, true)
    RETURNING *
  ` as any[];

  if (newSessions.length === 0) throw new Error(`Failed to create session for user: ${userId}`);
  return newSessions[0];
}

export async function switchSessionFlow(sessionId: string, newFlowType: string): Promise<void> {
  await sql`
    UPDATE whatsapp_sessions
    SET flow_type = ${newFlowType}, current_step = 0, state = '{}', updated_at = now()
    WHERE id = ${sessionId}
  `;
}

export async function updateSessionState(sessionId: string, updates: { state?: any; currentStep?: number; isActive?: boolean }): Promise<void> {
  const setParts = ['updated_at = now()'];
  if (updates.state !== undefined) setParts.push(`state = '${JSON.stringify(updates.state)}'::jsonb`);
  if (updates.currentStep !== undefined) setParts.push(`current_step = ${updates.currentStep}`);
  if (updates.isActive !== undefined) setParts.push(`is_active = ${updates.isActive}`);

  await sql.unsafe(`UPDATE whatsapp_sessions SET ${setParts.join(', ')} WHERE id = ${sessionId}`);
}

export async function logMessage(sessionId: string, direction: "incoming" | "outgoing", body: string, messageType = "text"): Promise<void> {
  await sql`
    INSERT INTO whatsapp_messages (session_id, direction, body, message_type, timestamp)
    VALUES (${sessionId}, ${direction}, ${body}, ${messageType}, now())
  `;
}

export async function getSessionMessages(sessionId: string, limit = 50): Promise<WhatsAppMessage[]> {
  const messages = await sql`
    SELECT * FROM whatsapp_messages
    WHERE session_id = ${sessionId}
    ORDER BY timestamp DESC
    LIMIT ${limit}
  ` as any[];
  return messages;
}

export async function getActiveSession(userId: string): Promise<WhatsAppSession | null> {
  const [session] = await sql`
    SELECT * FROM whatsapp_sessions
    WHERE user_id = ${userId} AND is_active = true
    LIMIT 1
  ` as any[];
  return session || null;
}

export async function closeSession(sessionId: string): Promise<void> {
  await sql`UPDATE whatsapp_sessions SET is_active = false, updated_at = now() WHERE id = ${sessionId}`;
}

// ============
// GESTIÓN HÍBRIDA
// ============

/**
 * GESTIÓN HÍBRIDA: Determina si usar leads legacy o sesiones multi-flow
 */
export async function handlePreapplyFlowDecision(
  userPhone: string,
  flowType: string
): Promise<{
  shouldUseEightQ: boolean;
  shouldUseMultiFlow: boolean;
  leadState?: PreapplyLeadState;
  userId?: string;
  session?: WhatsAppSession;
}> {

  if (flowType !== 'eight_q') {
    console.log(`🔄 HYBRID: Switching to ${flowType} multi-flow for ${userPhone}`);

    // Pausar cualquier lead activo
    await sql`UPDATE whatsapp_preapply_leads SET status = 'on_hold', updated_at = now() WHERE user_phone = ${userPhone} AND step < 8`;

    // Crear sesión multi-flow
    const user = await upsertWhatsAppUser(userPhone);
    const session = await getOrCreateActiveSession(user.id, flowType);

    return {
      shouldUseEightQ: false,
      shouldUseMultiFlow: true,
      userId: user.id,
      session,
    };
  }

  // Usar sistema legacy de 8 preguntas
  const leadState = await getOrCreatePreapplyLead(userPhone);
  if (!leadState) throw new Error(`Failed to create preapply lead for ${userPhone}`);

  return {
    shouldUseEightQ: true,
    shouldUseMultiFlow: false,
    leadState,
  };
}

/**
 * Actualizar status de un lead de preapply
 * Estados válidos: 'pending', 'approved', 'rejected', 'completed', 'on_hold'
 */
export async function updatePreapplyLeadStatus(leadId: number, status: string): Promise<boolean> {
  try {
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'on_hold'];

    if (!validStatuses.includes(status)) {
      console.error(`Invalid status: ${status}. Valid statuses: ${validStatuses.join(', ')}`);
      return false;
    }

    await sql`
      UPDATE whatsapp_preapply_leads
      SET status = ${status}, updated_at = now()
      WHERE id = ${leadId}
    `;

    console.log(`✅ Updated preapply lead ${leadId} status to: ${status}`);
    return true;

  } catch (error) {
    console.error('Error en updatePreapplyLeadStatus:', error);
    return false;
  }
}

/**
 * Obtener todas las respuestas de un lead
 */
export async function getPreapplyAnswers(leadId: number): Promise<Record<WhatsAppQuestionId, any> | null> {
  try {
    const result = await sql`
      SELECT answers
      FROM whatsapp_preapply_leads
      WHERE id = ${leadId}
      LIMIT 1
    ` as any[];

    if (result.length === 0 || !result[0]) return null;
    return result[0].answers || {};
  } catch (error) {
    console.error('Error en getPreapplyAnswers:', error);
    return null;
  }
}