// Multi-Flow Database Helper Functions
// Handles operations for whatsapp_users, whatsapp_sessions, whatsapp_messages

import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { whatsappUsers, whatsappSessions, whatsappMessages } from "@/db/schema";
import type { WhatsAppUser, WhatsAppSession, WhatsAppMessage } from "@/db/schema";

/**
 * Create or find WhatsApp user by phone
 */
export async function upsertWhatsAppUser(phone: string, name?: string): Promise<WhatsAppUser> {
  const existingUsers = await db
    .select()
    .from(whatsappUsers)
    .where(eq(whatsappUsers.phone, phone))
    .limit(1);

  if (existingUsers.length > 0) {
    const existing = existingUsers[0]!;
    // Update name if provided and different
    if (name && existing.name !== name) {
      await db
        .update(whatsappUsers)
        .set({ name, updatedAt: new Date() })
        .where(eq(whatsappUsers.id, existing.id));
      existing.name = name;
    }
    return existing;
  }

  // Create new user
  const newUsers = await db
    .insert(whatsappUsers)
    .values({
      phone,
      name,
      priorityLevel: "normal" as const,
    })
    .returning();

  if (newUsers.length === 0) {
    throw new Error(`Failed to create user for phone: ${phone}`);
  }

  return newUsers[0]!;
}

/**
 * Get or create active session for user
 */
export async function getOrCreateActiveSession(userId: string, flowType = "eight_q"): Promise<WhatsAppSession> {
  // Look for existing active session
  const [existing] = await db
    .select()
    .from(whatsappSessions)
    .where(and(
      eq(whatsappSessions.userId, userId),
      eq(whatsappSessions.isActive, true)
    ))
    .limit(1);

  if (existing) {
    // Check if flow type changed (switched flows)
    if (existing.flowType !== flowType) {
      await db
        .update(whatsappSessions)
        .set({
          flowType,
          currentStep: 0,
          state: {},
          updatedAt: new Date()
        })
        .where(eq(whatsappSessions.id, existing.id));
      existing.flowType = flowType;
      existing.currentStep = 0;
      existing.state = {};
    }
    return existing;
  }

  // Create new session
  const newSessions = await db
    .insert(whatsappSessions)
    .values({
      userId,
      flowType,
      state: {},
      currentStep: 0,
      isActive: true,
    })
    .returning();

  if (newSessions.length === 0) {
    throw new Error(`Failed to create session for user: ${userId}`);
  }

  return newSessions[0]!;
}

/**
 * Update session flow type and reset state
 */
export async function switchSessionFlow(sessionId: string, newFlowType: string): Promise<void> {
  await db
    .update(whatsappSessions)
    .set({
      flowType: newFlowType,
      currentStep: 0,
      state: {},
      updatedAt: new Date(),
    })
    .where(eq(whatsappSessions.id, sessionId));
}

/**
 * Update session state and step
 */
export async function updateSessionState(sessionId: string, updates: {
  state?: any;
  currentStep?: number;
  isActive?: boolean;
}): Promise<void> {
  const updateData: any = { updatedAt: new Date() };

  if (updates.state !== undefined) updateData.state = updates.state;
  if (updates.currentStep !== undefined) updateData.currentStep = updates.currentStep;
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

  await db
    .update(whatsappSessions)
    .set(updateData)
    .where(eq(whatsappSessions.id, sessionId));
}

/**
 * Log message to conversation history
 */
export async function logMessage(
  sessionId: string,
  direction: "incoming" | "outgoing",
  body: string,
  messageType = "text"
): Promise<WhatsAppMessage> {
  const newMessages = await db
    .insert(whatsappMessages)
    .values({
      sessionId,
      direction,
      body,
      messageType,
    })
    .returning();

  if (newMessages.length === 0) {
    throw new Error(`Failed to log message for session: ${sessionId}`);
  }

  return newMessages[0]!;
}

/**
 * Get conversation history for session
 */
export async function getSessionMessages(sessionId: string, limit = 50): Promise<WhatsAppMessage[]> {
  return await db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.sessionId, sessionId))
    .orderBy(whatsappMessages.timestamp)
    .limit(limit);
}

/**
 * Get user by phone
 */
export async function getUserByPhone(phone: string): Promise<WhatsAppUser | null> {
  const [user] = await db
    .select()
    .from(whatsappUsers)
    .where(eq(whatsappUsers.phone, phone))
    .limit(1);

  return user || null;
}

/**
 * Get active session by user ID
 */
export async function getActiveSession(userId: string): Promise<WhatsAppSession | null> {
  const [session] = await db
    .select()
    .from(whatsappSessions)
    .where(and(
      eq(whatsappSessions.userId, userId),
      eq(whatsappSessions.isActive, true)
    ))
    .limit(1);

  return session || null;
}

/**
 * Close session (for when conversation is done or user switches flows)
 */
export async function closeSession(sessionId: string): Promise<void> {
  await db
    .update(whatsappSessions)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(whatsappSessions.id, sessionId));
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId: string): Promise<WhatsAppSession | null> {
  const [session] = await db
    .select()
    .from(whatsappSessions)
    .where(eq(whatsappSessions.id, sessionId))
    .limit(1);

  return session || null;
}

/**
 * Utility: Clean up old inactive sessions (older than 30 days)
 */
export async function cleanupOldSessions(): Promise<number> {
  // Primero contamos los registros a eliminar
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(whatsappSessions)
    .where(and(
      eq(whatsappSessions.isActive, false),
      sql`started_at < ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}`
    ));

  const recordsToDelete = countResult[0]?.count || 0;

  // Ahora eliminamos sin returning
  await db
    .delete(whatsappSessions)
    .where(and(
      eq(whatsappSessions.isActive, false),
      sql`started_at < ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}`
    ));

  return recordsToDelete;
}

/**
 * Bulk logging for performance (when processing multiple messages)
 */
export async function bulkLogMessages(messages: Array<{
  sessionId: string;
  direction: "incoming" | "outgoing";
  body: string;
  messageType?: string;
}>): Promise<void> {
  if (messages.length === 0) return;

  await db.insert(whatsappMessages).values(
    messages.map(msg => ({
      sessionId: msg.sessionId,
      direction: msg.direction,
      body: msg.body,
      messageType: msg.messageType || "text",
    }))
  );
}
