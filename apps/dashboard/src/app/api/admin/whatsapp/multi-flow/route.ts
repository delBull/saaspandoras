import { sql } from '@/lib/database';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSimpleFlowStats } from '@/lib/whatsapp/core/simpleRouter';
import { getAuth, isAdmin } from '@/lib/auth';

// PATCH endpoint para actualizar status de leads
export async function PATCH(request: Request) {
  try {
    // Admin auth check
    const { session } = await getAuth(await headers());
    if (!session?.userId || !await isAdmin(session.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { leadId, status } = await request.json();

    if (!leadId || !status) {
      return NextResponse.json({ error: 'leadId y status son requeridos' }, { status: 400 });
    }

    // Actualizar el status en la base de datos del nuevo sistema
    // El leadId es el session_id del nuevo sistema
    
    // Si el status es 'completed' o 'rejected', desactivar la sesión
    if (status === 'completed' || status === 'rejected') {
      await sql`
        UPDATE whatsapp_sessions 
        SET state = jsonb_set(state, '{status}', ${JSON.stringify(status)}),
            is_active = false,
            updated_at = now()
        WHERE id = ${leadId}
      `;
    } else {
      await sql`
        UPDATE whatsapp_sessions 
        SET state = jsonb_set(state, '{status}', ${JSON.stringify(status)}),
            updated_at = now()
        WHERE id = ${leadId}
      `;
    }

    return NextResponse.json({ success: true, message: 'Status actualizado correctamente' });
  } catch (error) {
    console.error('Error updating lead status:', error);
    return NextResponse.json({ error: 'Error actualizando status' }, { status: 500 });
  }
}

// IMPORTANT: ALL ADMINS SHOULD SEE ALL WA LEADS globally
export async function GET(request: Request) {
  try {
    // Admin auth check - TUDOS los admins ven TODOS los leads
    const { session } = await getAuth(await headers());
    if (!session?.userId || !await isAdmin(session.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Debug logging for admin visibility - ALL ADMINS SEE ALL WA LEADS
    console.log(`🔍 [WA-LEADS] Admin ${session.userId} accessing ALL WA leads globally`);

    // El resto del código...
    console.log('📊 Fetching simplified WhatsApp data...');

    // Usar el nuevo sistema simplificado para estadísticas
    const flowStats = await getSimpleFlowStats();

    // Obtener leads activos con información simplificada
    const sessionsQuery = await sql`
      SELECT
        s.id,
        s.user_id,
        s.flow_type,
        s.current_step,
        s.is_active,
        s.started_at,
        s.updated_at,

        -- User info
        u.phone as user_phone,
        u.name as user_name,
        u.priority_level,

        -- Latest message
        (
          SELECT m.body 
          FROM whatsapp_messages m 
          WHERE m.session_id = s.id 
          ORDER BY m.timestamp DESC 
          LIMIT 1
        ) as last_message,
        
        (
          SELECT m.timestamp 
          FROM whatsapp_messages m 
          WHERE m.session_id = s.id 
          ORDER BY m.timestamp DESC 
          LIMIT 1
        ) as last_message_at

      FROM whatsapp_sessions s
      JOIN whatsapp_users u ON s.user_id = u.id
      WHERE s.is_active = true
      ORDER BY s.updated_at DESC
    ` as any[];

    // Transformar datos al formato esperado por el admin
    const leads = sessionsQuery.map(session => ({
      id: session.id,
      user_phone: session.user_phone,
      flow_type: session.flow_type,
      priority_level: session.priority_level,
      status: session.is_active ? 'active' : 'inactive',
      current_step: session.current_step || 0,
      applicant_name: session.user_name || null,
      last_message: session.last_message || null,
      session_started_at: session.started_at,
      updated_at: session.updated_at,
      last_message_at: session.last_message_at,
    }));

    // Calcular estadísticas simplificadas basadas en el nuevo sistema
    const simplifiedStats = {
      total: leads.length,
      active: leads.filter(l => l.status === 'active').length,
      
      // Estadísticas por flujo independiente
      eight_q: {
        total: flowStats.find(s => s.flow_type === 'eight_q')?.total_sessions || 0,
        active: flowStats.find(s => s.flow_type === 'eight_q')?.active_sessions || 0,
      },
      
      utility: {
        total: flowStats.find(s => s.flow_type === 'utility')?.total_sessions || 0,
        active: flowStats.find(s => s.flow_type === 'utility')?.active_sessions || 0,
      },
      
      high_ticket: {
        total: flowStats.find(s => s.flow_type === 'high_ticket')?.total_sessions || 0,
        active: flowStats.find(s => s.flow_type === 'high_ticket')?.active_sessions || 0,
      },
      
      support: {
        total: flowStats.find(s => s.flow_type === 'support')?.total_sessions || 0,
        active: flowStats.find(s => s.flow_type === 'support')?.active_sessions || 0,
      },
      
      human: {
        total: flowStats.find(s => s.flow_type === 'human')?.total_sessions || 0,
        active: flowStats.find(s => s.flow_type === 'human')?.active_sessions || 0,
      }
    };

    console.log(`✅ Simplified WhatsApp data: ${leads.length} leads, ${simplifiedStats.active} active conversations`);

    return NextResponse.json({
      success: true,
      leads,
      stats: simplifiedStats,
      flow_stats: flowStats, // Agregar estadísticas detalladas por flujo
      timestamp: new Date().toISOString(),
      system_version: '4.0-simple',
      cached: false,
    });

  } catch (error) {
    console.error('❌ Error fetching simplified WhatsApp data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch simplified WhatsApp data',
        leads: [],
        stats: {
          total: 0,
          active: 0,
          eight_q: { total: 0, active: 0 },
          utility: { total: 0, active: 0 },
          high_ticket: { total: 0, active: 0 },
          support: { total: 0, active: 0 },
          human: { total: 0, active: 0 },
        },
        flow_stats: [],
        timestamp: new Date().toISOString(),
        system_version: '4.0-simple',
      },
      { status: 500 }
    );
  }
}
