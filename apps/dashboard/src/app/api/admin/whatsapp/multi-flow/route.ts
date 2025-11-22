import { sql } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('📊 Fetching multi-flow WhatsApp data...');

    // Get all active sessions with their latest messages and user info
    const sessionsQuery = await sql`
      SELECT
        s.id,
        s.user_id,
        s.flow_type,
        s.current_step,
        s.state,
        s.status,
        s.is_active,
        s.created_at as session_started_at,
        s.updated_at,

        -- User info
        u.phone as user_phone,
        u.name as applicant_name,
        u.priority_level,

        -- Latest message
        m.body as last_message,
        m.timestamp as last_message_at

      FROM whatsapp_sessions s
      JOIN whatsapp_users u ON s.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT body, timestamp
        FROM whatsapp_messages
        WHERE session_id = s.id
        ORDER BY timestamp DESC
        LIMIT 1
      ) m ON true

      ORDER BY s.updated_at DESC
    ` as any[];

    // Transform sessions into the expected format
    const leads = sessionsQuery.map(session => ({
      id: session.id,
      user_phone: session.user_phone,
      flow_type: session.flow_type,
      priority_level: session.priority_level,
      status: session.status,
      current_step: session.current_step,
      applicant_name: session.applicant_name || null,
      applicant_email: null, // Not in new schema yet
      last_message: session.last_message || null,
      session_started_at: session.session_started_at,
      updated_at: session.updated_at,
    }));

    // Calculate statistics
    const stats = {
      total: leads.length,
      active: leads.filter(l => l.status === 'active' || l.status === 'pending').length,

      // Eight_q stats (protocol validation)
      eight_q: {
        total: leads.filter(l => l.flow_type === 'eight_q').length,
        pending: leads.filter(l => l.flow_type === 'eight_q' && l.status === 'pending').length,
        approved: leads.filter(l => l.flow_type === 'eight_q' && l.status === 'approved').length,
        completed: leads.filter(l => l.flow_type === 'eight_q' && l.status === 'completed').length,
      },

      // High_ticket stats (founders/investors)
      high_ticket: {
        total: leads.filter(l => l.flow_type === 'high_ticket').length,
        scheduled: leads.filter(l => l.flow_type === 'high_ticket' && l.status === 'scheduled').length,
        contacted: leads.filter(l => l.flow_type === 'high_ticket' && (l.status === 'contacted' || l.status === 'completed')).length,
      },

      // Utility stats (protocol creation)
      utility: {
        total: leads.filter(l => l.flow_type === 'utility').length,
        pending: leads.filter(l => l.flow_type === 'utility' && l.status === 'pending').length,
        approved: leads.filter(l => l.flow_type === 'utility' && l.status === 'approved').length,
      },

      // Support stats (technical support)
      support: {
        total: leads.filter(l => l.flow_type === 'support').length,
        escalated: leads.filter(l => l.flow_type === 'support' && l.status === 'escalated').length,
        resolved: leads.filter(l => l.flow_type === 'support' && l.status === 'resolved').length,
      },

      // Human stats (human agents)
      human: {
        total: leads.filter(l => l.flow_type === 'human').length,
        active: leads.filter(l => l.flow_type === 'human' && l.status === 'active').length,
        resolved: leads.filter(l => l.flow_type === 'human' && l.status === 'resolved').length,
      },
    };

    console.log(`✅ Multi-flow data: ${leads.length} leads, ${stats.active} active conversations`);

    return NextResponse.json({
      success: true,
      leads,
      stats,
      timestamp: new Date().toISOString(),
      cached: false, // For future caching implementation
    });

  } catch (error) {
    console.error('❌ Error fetching multi-flow data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch multi-flow WhatsApp data',
        leads: [],
        stats: {
          total: 0,
          active: 0,
          eight_q: { total: 0, pending: 0, approved: 0, completed: 0 },
          high_ticket: { total: 0, scheduled: 0, contacted: 0 },
          utility: { total: 0, pending: 0, approved: 0 },
          support: { total: 0, escalated: 0, resolved: 0 },
          human: { total: 0, active: 0, resolved: 0 },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
