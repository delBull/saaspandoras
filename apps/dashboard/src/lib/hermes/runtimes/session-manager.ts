import { db } from '@/db';
import { conversationSessions, marketingLeads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ContactContext } from './types';

export class SessionManager {
  /**
   * Initializes or resumes a session. Loads ContactContext into memory.
   */
  async startSession(tenantId: number, leadId: string | undefined, contactContext: ContactContext, channel: string = 'web_widget'): Promise<{ sessionId: string; context: ContactContext }> {
    // 1. If leadId is not provided, we create an anonymous lead
    let currentLeadId = leadId;

    if (!currentLeadId) {
      const [newLead] = await db.insert(marketingLeads).values({
        projectId: tenantId, // Project ID maps to Tenant ID
        origin: contactContext.entrypoint,
        contactContext: contactContext,
        leadType: 'anonymous', // Explicitly anonymous until merged
      }).returning({ id: marketingLeads.id });
      
      if (!newLead) throw new Error('Failed to create new lead');
      currentLeadId = newLead.id;
    } else {
      // Update existing lead context with the latest campaign context
      await db.update(marketingLeads)
        .set({
          contactContext: contactContext,
          lastEngagementAt: new Date(),
        })
        .where(eq(marketingLeads.id, currentLeadId));
    }

    // 2. Create the persistent Conversation Session
    const [session] = await db.insert(conversationSessions).values({
      tenantId,
      leadId: currentLeadId,
      channel,
      contactContext: contactContext,
      isActive: true,
    }).returning({ id: conversationSessions.id });

    if (!session) throw new Error('Failed to create session');

    return {
      sessionId: session.id,
      context: contactContext,
    };
  }
  
  /**
   * Updates in-memory/DB session state.
   */
  async updateContext(sessionId: string, patch: Partial<ContactContext>): Promise<void> {
    const [session] = await db.select({ context: conversationSessions.contactContext })
      .from(conversationSessions)
      .where(eq(conversationSessions.id, sessionId))
      .limit(1);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const mergedContext = {
      ...(session.context as Record<string, any>),
      ...patch,
    };

    await db.update(conversationSessions)
      .set({ contactContext: mergedContext })
      .where(eq(conversationSessions.id, sessionId));
  }
  
  /**
   * Flushes in-memory context to persistent storage and ends session.
   */
  async endSession(sessionId: string): Promise<void> {
    const [session] = await db.update(conversationSessions)
      .set({
        isActive: false,
        endedAt: new Date(),
      })
      .where(eq(conversationSessions.id, sessionId))
      .returning({ leadId: conversationSessions.leadId, context: conversationSessions.contactContext });

    if (session && session.leadId) {
      // Sync final context down to the lead
      await db.update(marketingLeads)
        .set({ contactContext: session.context })
        .where(eq(marketingLeads.id, session.leadId));
    }
  }
}
