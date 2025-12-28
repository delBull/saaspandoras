import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth, isAdmin } from '@/lib/auth';

// Resend API Integration for Marketing Metrics
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_BASE_URL = 'https://api.resend.com/v1';

import { sql } from '@/lib/database';

/**
 * Get real email metrics from database when available, otherwise fallback to API/simulated
 */
async function getEmailMetrics(timeRange: '24h' | '7d' | '30d' = '7d') {
  try {
    console.log('📊 Getting email metrics for range:', timeRange);

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // First try to get real metrics from database (from webhooks)
    try {
      const realMetrics = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
          COUNT(*) FILTER (WHERE status = 'opened') as opened,
          COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
          COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
          COUNT(*) FILTER (WHERE status = 'complained') as complained,
          COUNT(DISTINCT email_id) as unique_emails,
          MAX(created_at) as last_email_at,

          -- By type breakdown
          COUNT(*) FILTER (WHERE type = 'creator_welcome' AND status = 'sent') as creator_sent,
          COUNT(*) FILTER (WHERE type = 'creator_welcome' AND status = 'delivered') as creator_delivered,
          COUNT(*) FILTER (WHERE type = 'creator_welcome' AND status = 'opened') as creator_opened,
          COUNT(*) FILTER (WHERE type = 'creator_welcome' AND status = 'clicked') as creator_clicked,

          COUNT(*) FILTER (WHERE type = 'founders' AND status = 'sent') as founders_sent,
          COUNT(*) FILTER (WHERE type = 'founders' AND status = 'delivered') as founders_delivered,
          COUNT(*) FILTER (WHERE type = 'utility' AND status = 'sent') as utility_sent
        FROM email_metrics
        WHERE created_at >= ${startDate}
      ` as any[];

      console.log('📊 Database metrics result:', realMetrics[0]);

      if (realMetrics && realMetrics.length > 0 && (realMetrics[0]?.total || 0) > 0) {
        const metrics = realMetrics[0];

        // Calculate rates
        const total = Number(metrics.total) || 0;
        const delivered = Number(metrics.delivered) || 0;
        const opened = Number(metrics.opened) || 0;
        const clicked = Number(metrics.clicked) || 0;
        const bounced = Number(metrics.bounced) || 0;

        const deliveryRate = total > 0 ? parseFloat(((delivered / total) * 100).toFixed(1)) : 0;
        const openRate = delivered > 0 ? parseFloat(((opened / delivered) * 100).toFixed(1)) : 0;
        const clickRate = delivered > 0 ? parseFloat(((clicked / delivered) * 100).toFixed(1)) : 0;

        // console.log(`✅ Found real metrics from database: ${total} total, ${delivered} delivered, ${opened} opened, ${clicked} clicked`);

        return {
          timeRange,
          total,
          delivered,
          bounced,
          opened,
          clicked,
          complained: Number(metrics.complained) || 0,
          deliveryRate: deliveryRate.toString(),
          openRate: openRate.toString(),
          clickRate: clickRate.toString(),
          uniqueEmails: Number(metrics.unique_emails) || 0,
          byType: {
            creator_welcome: {
              sent: Number(metrics.creator_sent) || 0,
              delivered: Number(metrics.creator_delivered) || 0,
              opened: Number(metrics.creator_opened) || 0,
              clicked: Number(metrics.creator_clicked) || 0,
              bounced: 0
            },
            founders: {
              sent: Number(metrics.founders_sent) || 0,
              delivered: Number(metrics.founders_delivered) || 0,
              opened: 0,
              clicked: 0,
              bounced: 0
            },
            utility: {
              sent: Number(metrics.utility_sent) || 0,
              delivered: 0,
              opened: 0,
              clicked: 0,
              bounced: 0
            }
          },
          lastEmail: metrics.last_email_at || new Date().toISOString(),
          updated: new Date().toISOString(),
          simulated: false, // These are real metrics
          source: 'database'
        };
      }

      // If query succeeded but no data found, or if the if condition was not met
      return {
        timeRange,
        total: 0,
        delivered: 0,
        bounced: 0,
        opened: 0,
        clicked: 0,
        complained: 0,
        deliveryRate: '0.0',
        openRate: '0.0',
        clickRate: '0.0',
        uniqueEmails: 0,
        byType: {},
        lastEmail: null,
        updated: new Date().toISOString(),
        simulated: false, // Explicitly NOT simulated
        source: 'database_empty'
      };

    } catch (dbError) {
      console.warn('⚠️ Database query failed:', dbError);
      throw dbError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('❌ Error getting email metrics:', error);
    // Return empty metrics on error
    return {
      timeRange,
      total: 0,
      delivered: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      complained: 0,
      deliveryRate: '0.0',
      openRate: '0.0',
      clickRate: '0.0',
      uniqueEmails: 0,
      byType: {},
      lastEmail: null,
      updated: new Date().toISOString(),
      simulated: false,
      source: 'error'
    };
  }
}

// POST /api/admin/marketing/test-resend - Test Resend API connection and list emails
export async function POST(request: NextRequest) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      return NextResponse.json({
        status: 'error',
        message: 'RESEND_API_KEY not configured',
      }, { status: 400 });
    }

    // Get last 10 emails from Resend
    const emailsResponse = await fetch('https://api.resend.com/v1/emails', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!emailsResponse.ok) {
      return NextResponse.json({
        status: 'error',
        message: `Resend API error: ${emailsResponse.status}`,
        response: await emailsResponse.text(),
      }, { status: 500 });
    }

    const emails = await emailsResponse.json();
    const emailList = (emails.data || []).slice(0, 10);

    return NextResponse.json({
      status: 'success',
      api_working: true,
      total_emails: emailList.length,
      recent_emails: emailList.map((email: any) => ({
        id: email.id,
        subject: email.subject,
        created_at: email.created_at,
        status: email.status,
        to: email.to
      }))
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
    }, { status: 500 });
  }
}

// GET /api/admin/marketing/metrics - Get all marketing metrics
export async function GET(request: NextRequest) {
  try {
    // Admin auth check - ALL ADMINS see ALL marketing metrics globally
    const { session } = await getAuth(await headers());
    if (!session?.userId || !await isAdmin(session.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // console.log(`📊 [MARKETING-METRICS] Admin ${session.userId} accessing marketing metrics globally`);

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('range') as '24h' | '7d' | '30d') || '7d';

    // Get email metrics from DB
    const emailMetrics = await getEmailMetrics(timeRange);

    return NextResponse.json({
      status: 'live', // Always live now
      email: emailMetrics,
      whatsapp: null,
      timeRange,
      timestamp: new Date().toISOString(),
      message: null
    });

  } catch (error) {
    console.error('Error in marketing metrics API:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Error interno del servidor de métricas',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
