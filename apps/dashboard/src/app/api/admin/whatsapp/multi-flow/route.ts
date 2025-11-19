// MULTI-FLOW WHATSAPP ADMIN API
// Comprehensive endpoint for WhatsApp Multi-Flow Dashboard

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Import database functions - ADD when multi-flow queries are ready
// import { getAllMultiFlowLeads, getMultiFlowStats } from '@/lib/whatsapp/multi-flow-db';

// Import legacy queries for now
import { eq, sql, desc } from 'drizzle-orm';
import { db } from '@/db';
import { whatsappUsers, whatsappSessions, whatsappMessages, whatsappPreapplyLeads } from '@/db/schema';

// Types for the response
interface MultiFlowLead {
  id: string;
  user_phone: string;
  flow_type: string;
  priority_level: string;
  status: string;
  current_step: number;
  applicant_name?: string;
  applicant_email?: string;
  last_message?: string;
  session_started_at: string;
  updated_at: string;
  answers?: any;
}

interface FlowStats {
  total: number;
  active: number;
  eight_q: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
  };
  high_ticket: {
    total: number;
    scheduled: number;
    contacted: number;
  };
  support: {
    total: number;
    escalated: number;
    resolved: number;
  };
  human: {
    total: number;
    active: number;
    resolved: number;
  };
}

/**
 * Get comprehensive data for Multi-Flow Dashboard
 */
async function getMultiFlowData(): Promise<{
  leads: MultiFlowLead[];
  stats: FlowStats;
}> {
  try {
    // Get all active sessions with user data
    const sessions = await db
      .select({
        session_id: whatsappSessions.id,
        user_id: whatsappUsers.id,
        phone: whatsappUsers.phone,
        name: whatsappUsers.name,
        priority: whatsappUsers.priorityLevel,
        flow_type: whatsappSessions.flowType,
        current_step: whatsappSessions.currentStep,
        session_status: whatsappSessions.isActive,
        session_started_at: whatsappSessions.startedAt,
        updated_at: whatsappSessions.updatedAt,
        // For now, we'll map these from different sources
        status: sql<string>`COALESCE(NULL, 'pending')`, // Will be determined by flow logic
        answers: whatsappSessions.state,
      })
      .from(whatsappSessions)
      .innerJoin(whatsappUsers, eq(whatsappSessions.userId, whatsappUsers.id))
      .where(eq(whatsappSessions.isActive, true))
      .orderBy(desc(whatsappSessions.updatedAt))
      .limit(1000); // Limit for performance

    // Get legacy eight_q leads (for backwards compatibility)
    const legacyLeads = await db
      .select({
        id: whatsappPreapplyLeads.id,
        phone: whatsappPreapplyLeads.userPhone,
        name: sql<string | null>`NULL`, // Legacy doesn't have names
        priority: sql<string>`'normal'`, // Default priority
        flow_type: sql<string>`'eight_q'`,
        current_step: whatsappPreapplyLeads.step,
        status: whatsappPreapplyLeads.status,
        answers: whatsappPreapplyLeads.answers,
        last_message: whatsappPreapplyLeads.updatedAt,
        session_started_at: whatsappPreapplyLeads.createdAt,
        updated_at: whatsappPreapplyLeads.updatedAt,
        email: sql<string | null>`NULL`, // No email in legacy
      })
      .from(whatsappPreapplyLeads)
      .orderBy(desc(whatsappPreapplyLeads.updatedAt))
      .limit(1000);

    // Get last message for each session
    const sessionLastMessages = await db
      .select({
        sessionId: whatsappMessages.sessionId,
        lastMessage: whatsappMessages.body,
        timestamp: whatsappMessages.timestamp,
      })
      .from(whatsappMessages)
      .where(sql`session_id IN (SELECT id FROM whatsapp_sessions WHERE is_active = true)
                 OR session_id IN (SELECT CAST(id AS TEXT) FROM whatsapp_preapply_leads)`)
      .orderBy(desc(whatsappMessages.timestamp));

    // Create a map of last messages by session/user
    const lastMessageMap = new Map<string, string>();
    sessionLastMessages.forEach(msg => {
      if (msg.sessionId && !lastMessageMap.has(msg.sessionId)) {
        lastMessageMap.set(msg.sessionId, msg.lastMessage || "Sin mensajes");
      }
    });

    // Combine and transform leads
    const leads: MultiFlowLead[] = [
      // New multi-flow sessions
      ...sessions.map(session => ({
        id: session.session_id,
        user_phone: session.phone,
        flow_type: session.flow_type,
        priority_level: session.priority,
        status: determineStatusByFlow(session.flow_type, session.current_step),
        current_step: session.current_step,
        applicant_name: session.name || undefined,
        applicant_email: undefined, // Not collected in conversations yet
        last_message: lastMessageMap.get(session.session_id) || "Sin mensajes",
        session_started_at: session.session_started_at.toISOString(),
        updated_at: session.updated_at.toISOString(),
        answers: session.answers,
      })),

      // Legacy eight_q leads (mapped to multi-flow format)
      ...legacyLeads.map(lead => ({
        id: lead.id.toString(),
        user_phone: lead.phone,
        flow_type: 'eight_q',
        priority_level: lead.priority,
        status: lead.status,
        current_step: lead.current_step,
        applicant_name: lead.name!,
        applicant_email: lead.email!,
        last_message: lastMessageMap.get(lead.id.toString()) || `Paso ${lead.current_step}/8`,
        session_started_at: lead.session_started_at.toISOString(),
        updated_at: lead.updated_at.toISOString(),
        answers: lead.answers,
      }))
    ];

    // Calculate comprehensive stats
    const stats = await calculateMultiFlowStats();

    return { leads, stats };
  } catch (error) {
    console.error('❌ Error fetching multi-flow data:', error);
    throw error;
  }
}

/**
 * Calculate comprehensive multi-flow statistics
 */
async function calculateMultiFlowStats(): Promise<FlowStats> {
  try {
    // Get counts by flow type from active sessions
    const flowCountsResult = await db
      .select({
        eight_q_count: sql<number>`COUNT(CASE WHEN flow_type = 'eight_q' THEN 1 END)`,
        high_ticket_count: sql<number>`COUNT(CASE WHEN flow_type = 'high_ticket' THEN 1 END)`,
        support_count: sql<number>`COUNT(CASE WHEN flow_type = 'support' THEN 1 END)`,
        human_count: sql<number>`COUNT(CASE WHEN flow_type = 'human' THEN 1 END)`,
        total: sql<number>`COUNT(*)`,
      })
      .from(whatsappSessions)
      .where(eq(whatsappSessions.isActive, true));

    const flowCounts = flowCountsResult[0] || {
      eight_q_count: 0,
      high_ticket_count: 0,
      support_count: 0,
      human_count: 0,
      total: 0,
    };

    // Get legacy eight_q stats
    const legacyStatsResult = await db
      .select({
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
        approved: sql<number>`COUNT(CASE WHEN status = 'approved' THEN 1 END)`,
        completed: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
      })
      .from(whatsappPreapplyLeads);

    const legacyStats = legacyStatsResult[0] || {
      total: 0,
      pending: 0,
      approved: 0,
      completed: 0,
    };

    const stats: FlowStats = {
      total: flowCounts.total + legacyStats.total,
      active: flowCounts.total,
      eight_q: {
        total: flowCounts.eight_q_count + legacyStats.total,
        pending: legacyStats.pending,
        approved: legacyStats.approved,
        completed: legacyStats.completed,
      },
      high_ticket: {
        total: flowCounts.high_ticket_count,
        scheduled: 0, // TODO: Add specific status tracking
        contacted: 0, // TODO: Add specific status tracking
      },
      support: {
        total: flowCounts.support_count,
        escalated: 0, // TODO: Add escalation tracking
        resolved: 0, // TODO: Add resolution tracking
      },
      human: {
        total: flowCounts.human_count,
        active: flowCounts.human_count, // All human flows are active
        resolved: 0, // TODO: Add resolution tracking
      },
    };

    return stats;
  } catch (error) {
    console.error('❌ Error calculating stats:', error);
    return getDefaultStats();
  }
}

/**
 * Determine status based on flow type and current step
 */
function determineStatusByFlow(flowType: string, currentStep: number): string {
  if (!flowType) return 'pending';

  switch (flowType) {
    case 'eight_q':
      if (currentStep >= 8) return 'completed';
      if (currentStep >= 6) return 'approved'; // Ready for final confirmation
      return 'pending';

    case 'high_ticket':
      return currentStep === 0 ? 'pending' : 'scheduled';

    case 'support':
    case 'human':
      return 'active'; // Human interactions are always active

    default:
      return 'pending';
  }
}

/**
 * Get default stats when calculation fails
 */
function getDefaultStats(): FlowStats {
  return {
    total: 0,
    active: 0,
    eight_q: { total: 0, pending: 0, approved: 0, completed: 0 },
    high_ticket: { total: 0, scheduled: 0, contacted: 0 },
    support: { total: 0, escalated: 0, resolved: 0 },
    human: { total: 0, active: 0, resolved: 0 },
  };
}

// ===================
// API ENDPOINTS
// ===================

// GET - Multi-Flow Dashboard Data
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching multi-flow dashboard data...');

    const data = await getMultiFlowData();

    console.log(`✅ Retrieved ${data.leads.length} leads and stats for ${data.stats.total} total conversations`);

    return NextResponse.json({
      success: true,
      ...data,
      timestamp: new Date().toISOString(),
      cached: false, // TODO: Add caching later
    });

  } catch (error) {
    console.error('❌ Multi-flow API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch multi-flow data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST - Update lead status (future: move lead to different flow)
// export async function POST(request: NextRequest) {
//   // TODO: Add POST endpoint for actions if needed
// }
