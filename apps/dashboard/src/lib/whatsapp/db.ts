import { Pool } from 'pg';
import { WhatsAppApplicationState } from '@/db/schema';

// Pool de conexión a Neon para WhatsApp
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Tipos para respuestas
interface WhatsAppState {
  id?: number;
  userPhone: string;
  wallet?: string | null;
  currentStep: number;
  answers: Record<string, any>;
  completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Obtener estado actual de un usuario por teléfono
 */
export async function getUserState(userPhone: string): Promise<WhatsAppState | null> {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM whatsapp_application_states WHERE user_phone = $1 LIMIT 1',
      [userPhone]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      userPhone: row.user_phone,
      wallet: row.wallet,
      currentStep: row.current_step || 0,
      answers: row.answers || {},
      completed: row.completed || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('Error getting WhatsApp user state:', error);
    return null;
  }
}

/**
 * Crear nuevo estado para usuario según teléfono
 */
export async function createUserState(userPhone: string): Promise<WhatsAppState | null> {
  try {
    const { rows } = await pool.query(
      `INSERT INTO whatsapp_application_states (user_phone, current_step, answers, completed)
       VALUES ($1, 0, '{}', false)
       RETURNING *`,
      [userPhone]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      userPhone: row.user_phone,
      wallet: row.wallet,
      currentStep: row.current_step || 0,
      answers: row.answers || {},
      completed: row.completed || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('Error creating WhatsApp user state:', error);
    // Si ya existe, devolver el existente
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // unique_violation
      return getUserState(userPhone);
    }
    return null;
  }
}

/**
 * Guardar respuesta incremental en el estado del usuario
 */
export async function saveAnswer(userPhone: string, field: string, value: any): Promise<boolean> {
  try {
    await pool.query(
      `UPDATE whatsapp_application_states
       SET answers = jsonb_set(answers, $1, $2::jsonb),
           updated_at = NOW()
       WHERE user_phone = $3`,
      [`{${field}}`, JSON.stringify(value), userPhone]
    );
    return true;
  } catch (error) {
    console.error('Error saving WhatsApp answer:', error);
    return false;
  }
}

/**
 * Avanzar al siguiente paso en el formulario
 */
export async function advanceStep(userPhone: string): Promise<boolean> {
  try {
    await pool.query(
      `UPDATE whatsapp_application_states
       SET current_step = current_step + 1, updated_at = NOW()
       WHERE user_phone = $1`,
      [userPhone]
    );
    return true;
  } catch (error) {
    console.error('Error advancing WhatsApp step:', error);
    return false;
  }
}

/**
 * Obtener el estado actual y las respuestas acumuladas
 */
export async function getCurrentAnswers(userPhone: string): Promise<Record<string, any> | null> {
  try {
    const { rows } = await pool.query(
      'SELECT answers FROM whatsapp_application_states WHERE user_phone = $1',
      [userPhone]
    );
    return rows.length > 0 ? rows[0].answers || {} : null;
  } catch (error) {
    console.error('Error gettingcurrent answers:', error);
    return null;
  }
}

/**
 * Marcar formulario como completado
 */
export async function markCompleted(userPhone: string): Promise<boolean> {
  try {
    await pool.query(
      `UPDATE whatsapp_application_states
       SET completed = true, updated_at = NOW()
       WHERE user_phone = $1`,
      [userPhone]
    );
    return true;
  } catch (error) {
    console.error('Error marking WhatsApp form completed:', error);
    return false;
  }
}
