import { sql } from "@/lib/database"; // Usar el connection pool actual
import type { WhatsAppQuestionId } from './flowConfig';

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

/**
 * Obtener o crear estado inicial para un lead de pre-apply
 */
export async function getOrCreatePreapplyLead(userPhone: string): Promise<PreapplyLeadState | null> {
  try {
    // Intentar obtener lead existente
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

    // Crear nuevo lead
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
 * Obtener estado actual de un lead
 */
export async function getPreapplyLeadByPhone(userPhone: string): Promise<PreapplyLeadState | null> {
  try {
    const result = await sql`
      SELECT id, user_phone, step, status, answers, applicant_name, applicant_email, created_at, updated_at
      FROM whatsapp_preapply_leads
      WHERE user_phone = ${userPhone}
      LIMIT 1
    ` as any[];

    if (result.length === 0 || !result[0]) return null;

    const row = result[0];
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
    console.error('Error en getPreapplyLeadByPhone:', error);
    return null;
  }
}

/**
 * Guardar respuesta a una pregunta
 */
export async function savePreapplyAnswer(leadId: number, questionId: WhatsAppQuestionId, answer: any, applicantName?: string, applicantEmail?: string): Promise<boolean> {
  try {
    const updateData: any = {
      answers: sql`jsonb_set(answers, ${`{${questionId}}`}, ${JSON.stringify(answer)})`,
      updated_at: new Date()
    };

    // Actualizar datos del aplicante extraídos de la respuesta Q3
    if (applicantName) updateData.applicant_name = applicantName;
    if (applicantEmail) updateData.applicant_email = applicantEmail;

    await sql`
      UPDATE whatsapp_preapply_leads
      SET ${sql(updateData)}
      WHERE id = ${leadId}
    `;

    return true;
  } catch (error) {
    console.error('Error en savePreapplyAnswer:', error);
    return false;
  }
}

/**
 * Avanzar al siguiente step
 */
export async function advancePreapplyStep(leadId: number): Promise<boolean> {
  try {
    await sql`
      UPDATE whatsapp_preapply_leads
      SET step = step + 1, updated_at = now()
      WHERE id = ${leadId}
    `;
    return true;
  } catch (error) {
    console.error('Error en advancePreapplyStep:', error);
    return false;
  }
}

/**
 * Marcar lead como completado (terminó las 8 preguntas)
 */
export async function markPreapplyCompleted(leadId: number, status: 'completed' | 'pending' = 'completed'): Promise<boolean> {
  try {
    await sql`
      UPDATE whatsapp_preapply_leads
      SET status = ${status}, updated_at = now()
      WHERE id = ${leadId}
    `;
    return true;
  } catch (error) {
    console.error('Error en markPreapplyCompleted:', error);
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

/**
 * Actualizar status de un lead (para admin management)
 */
export async function updatePreapplyLeadStatus(leadId: number, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> {
  try {
    await sql`
      UPDATE whatsapp_preapply_leads
      SET status = ${status}, updated_at = now()
      WHERE id = ${leadId}
    `;
    return true;
  } catch (error) {
    console.error('Error en updatePreapplyLeadStatus:', error);
    return false;
  }
}

/**
 * Obtener todos los leads para admin dashboard
 */
export async function getAllPreapplyLeads(): Promise<PreapplyLeadState[]> {
  try {
    const results = await sql`
      SELECT
        id, user_phone, step, status, answers,
        applicant_name, applicant_email,
        created_at, updated_at
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
