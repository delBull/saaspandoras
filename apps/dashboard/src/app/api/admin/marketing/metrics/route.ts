import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Resend API Integration for Marketing Metrics
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_BASE_URL = 'https://api.resend.com/v1';

/**
 * Get email analytics from simulated data
 * Note: Resend API v1 doesn't support programatic email listing
 * Use webhooks instead for real-time metrics tracking
 */
function getEmailMetrics(timeRange: '24h' | '7d' | '30d' = '7d') {
  console.log('📧 Using local analytics data (Resend webhooks available for real metrics)');

  // Always return simulated data since Resend API v1 doesn't support GET /emails
  // In a production system with webhooks, this would aggregate data from your database
  return {
    timeRange,
    total: 45,
    delivered: 43,
    bounced: 2,
    opened: 18,
    clicked: 7,
    deliveryRate: '95.6',
    openRate: '41.9',
    clickRate: '16.3',
    byType: {
      creator_welcome: { sent: 25, delivered: 24, opened: 12, clicked: 5, bounced: 1 },
      founders: { sent: 12, delivered: 11, opened: 6, clicked: 2, bounced: 1 },
      utility: { sent: 8, delivered: 8, opened: 0, clicked: 0, bounced: 0 }
    },
    lastEmail: new Date().toISOString(),
    updated: new Date().toISOString(),
    simulated: true,
    note: 'Resend API v1 no soporta listados de emails. Usa webhooks para métricas reales.'
  };
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
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeRange = (searchParams.get('range') as '24h' | '7d' | '30d') || '7d';

  try {
    // Get email metrics from Resend
    const emailMetrics = getEmailMetrics(timeRange);

    if (!emailMetrics) {
      return NextResponse.json({
        status: 'no_resend_integration',
        message: 'Resend API not configured. Showing simulated data.',
        timeRange,
        timestamp: new Date().toISOString(),
        email: {
          timeRange,
          total: 0,
          delivered: 0,
          bounced: 0,
          opened: 0,
          clicked: 0,
          deliveryRate: '0.0',
          openRate: '0.0',
          clickRate: '0.0',
          byType: {},
          updated: new Date().toISOString(),
          simulated: true
        }
      });
    }

    // Check if data is simulated
    const isSimulated = emailMetrics.simulated || false;

    return NextResponse.json({
      status: isSimulated ? 'simulated' : 'live',
      email: emailMetrics,
      whatsapp: null, // Could be added later
      timeRange,
      timestamp: new Date().toISOString(),
      message: isSimulated ? 'Mostrando datos simulados. Configura RESEND_API_KEY para datos reales.' : null
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
