import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';

// Resend Webhook Security
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

/**
 * Resend webhook payload types
 */
interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    created_at: string;
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    status?: string;
    tags?: Array<{ name: string; value: string }>;
    user_id?: string;
    domain_id?: string;
    // Click specific data
    url?: string;
    link?: string;
    // Bounce specific data
    bounce_type?: string;
    bounce_code?: string;
    error_message?: string;
    // Open specific data
    user_agent?: string;
    ip?: string;
  };
}

/**
 * POST /api/admin/marketing/resend-webhook
 * Webhook endpoint for Resend email events to track real-time metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // 1. Verify webhook signature using Resend HMAC SHA256 format
    // Based on: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests

    // Log all headers to debug what Resend is sending
    console.log('📧 [WEBHOOK-HEADERS] All incoming headers:');
    for (const [key, value] of request.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    // Check for both possible header formats
    if (WEBHOOK_SECRET) {
      // Try Resend v1 format first (most common)
      let signature = request.headers.get('resend-signature');
      let timestamp = request.headers.get('resend-timestamp');
      let webhookId = request.headers.get('resend-webhook-id');

      // If not found, try alternative formats
      if (!signature) {
        signature = request.headers.get('X-Resend-Signature') || request.headers.get('x-resend-signature');
      }
      if (!timestamp) {
        timestamp = request.headers.get('X-Resend-Signature-Timestamp') || request.headers.get('resend-timestamp');
      }
      if (!webhookId) {
        webhookId = request.headers.get('X-Resend-Webhook-Id') || request.headers.get('resend-webhook-id');
      }

      console.log(`📧 [WEBHOOK-HEADERS] Extracted:`, {
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
        hasWebhookId: !!webhookId,
        signaturePreview: signature?.substring(0, 20) + '...',
        timestamp,
        webhookId,
        WEBHOOK_SECRET: WEBHOOK_SECRET ? '***configured***' : 'not configured'
      });

      if (!signature || !timestamp || !webhookId) {
        console.error('❌ Missing required webhook signature headers');
        return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
      }

      // Create the signed content
      const signedContent = `${webhookId}.${timestamp}.${body}`;

      // Create HMAC SHA256 signature
      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
      hmac.update(signedContent, 'utf8');
      const computedSignature = hmac.digest('base64');

      // Compare signatures
      const isValid = crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(signature)
      );

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        console.log('🔐 Expected:', computedSignature);
        console.log('🔐 Received:', signature);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      console.log('✅ Webhook signature verified successfully');
    } else {
      console.warn('⚠️ RESEND_WEBHOOK_SECRET not configured - accepting without verification');
    }

    // 2. Parse webhook payload
    const payload: ResendWebhookEvent = JSON.parse(body);

    console.log(`📧 Webhook Event: ${String(payload.type)} for email ${payload.data.email_id}`);

    // 3. Process event based on type
    switch (payload.type) {
      case 'email.delivered':
        handleEmailDelivered(payload);
        break;
      case 'email.opened':
        handleEmailOpened(payload);
        break;
      case 'email.clicked':
        handleEmailClicked(payload);
        break;
      case 'email.bounced':
        handleEmailBounced(payload);
        break;
      case 'email.complained':
        handleEmailComplained(payload);
        break;
      case 'email.spam':
        handleEmailSpam(payload);
        break;
      default:
        console.log(`⚠️ Unknown webhook event type: ${payload.type}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error processing Resend webhook:', error);
    return NextResponse.json({
      error: 'Webhook processing failed',
      message: error.message
    }, { status: 500 });
  }
}

// GET endpoint for webhook debugging
export function GET() {
  try {
    const headersList = {
      'WEBHOOK_SECRET_CONFIGURED': !!WEBHOOK_SECRET,
      'WEBHOOK_SECRET_VALUE': WEBHOOK_SECRET ? '**configured**' : '**not configured**',
      'INSTRUCTIONS': 'POST to this endpoint to see webhook debugging logs',
      'EXPECTED_HEADERS': [
        'resend-signature',
        'resend-timestamp',
        'resend-webhook-id'
      ],
      'ALTERNATIVE_HEADERS': [
        'X-Resend-Signature',
        'X-Resend-Signature-Timestamp',
        'X-Resend-Webhook-Id'
      ]
    };

    return NextResponse.json({
      status: 'webhook_debug_endpoint',
      message: 'Use POST method to test webhook with your headers',
      configured: !!WEBHOOK_SECRET,
      last_check: new Date().toISOString(),
      ...headersList
    });

  } catch (error) {
    console.error('Error in webhook debug GET:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed'
    }, { status: 500 });
  }
}

/**
 * Handle email delivered events
 */
async function handleEmailDelivered(event: ResendWebhookEvent) {
  try {
    const { email_id, to, subject, tags } = event.data;
    const recipient: string = (to && to.length > 0) ? to[0] || '' : '';
    const audienceTag: string = tags?.find(tag => tag.name === 'audience')?.value || 'unknown';
    const emailSubject: string = subject || '';
    const metadata: string = JSON.stringify(event);

    console.log(`✅ Email delivered: ${email_id} to ${recipient}`);

    await sql`
      INSERT INTO email_metrics (
        email_id, type, status, recipient, email_subject,
        delivered_at, metadata
      )
      VALUES (
        ${email_id}, ${audienceTag}, 'delivered', ${recipient}, ${emailSubject},
        NOW(), ${metadata}
      )
      ON CONFLICT (email_id)
      DO UPDATE SET
        status = 'delivered',
        delivered_at = NOW(),
        updated_at = NOW()
    `;

  } catch (error) {
    console.error('Error handling email delivered:', error);
  }
}

/**
 * Handle email opened events
 */
async function handleEmailOpened(event: ResendWebhookEvent) {
  try {
    const { email_id, to, user_agent, ip } = event.data;
    const recipient: string = to ? to[0] || '' : '';

    console.log(`👁️ Email opened: ${email_id} by ${recipient} from ${ip}`);

    await sql`
      INSERT INTO email_metrics (email_id, type, status, recipient, opened_at, user_agent, ip_address, metadata)
      VALUES (
        ${email_id}, 'unknown', 'opened', ${recipient},
        NOW(), NULL, NULL, ${JSON.stringify(event)}
      )
      ON CONFLICT (email_id)
      DO UPDATE SET
        status = COALESCE(email_metrics.status, 'opened'),
        opened_at = NOW(),
        updated_at = NOW()
    `;

  } catch (error) {
    console.error('Error handling email opened:', error);
  }
}

/**
 * Handle email clicked events
 */
async function handleEmailClicked(event: ResendWebhookEvent) {
  try {
    const { email_id, to, url, link } = event.data;
    const recipient: string = to ? to[0] || '' : '';
    const clickedUrl: string = url || link || '';

    console.log(`👆 Email clicked: ${email_id} - ${clickedUrl} by ${recipient}`);

    await sql`
      INSERT INTO email_metrics (email_id, type, status, recipient, clicked_url, clicked_at, metadata)
      VALUES (
        ${email_id}, 'unknown', 'clicked', ${recipient},
        ${clickedUrl}, NOW(), ${JSON.stringify(event)}
      )
      ON CONFLICT (email_id)
      DO UPDATE SET
        status = COALESCE(email_metrics.status, 'clicked'),
        clicked_url = COALESCE(${clickedUrl}, email_metrics.clicked_url),
        clicked_at = NOW(),
        updated_at = NOW()
    `;

  } catch (error) {
    console.error('Error handling email clicked:', error);
  }
}

/**
 * Handle email bounced events
 */
async function handleEmailBounced(event: ResendWebhookEvent) {
  try {
    const { email_id, to } = event.data;
    const recipient: string = to ? to[0] || '' : '';

    console.log(`❌ Email bounced: ${email_id} to ${recipient}`);

    await sql`
      INSERT INTO email_metrics (email_id, type, status, recipient, bounced_at, metadata)
      VALUES (
        ${email_id}, 'unknown', 'bounced', ${recipient},
        NOW(), ${JSON.stringify(event)}
      )
      ON CONFLICT (email_id)
      DO UPDATE SET
        status = 'bounced',
        bounced_at = NOW(),
        updated_at = NOW()
    `;

  } catch (error) {
    console.error('Error handling email bounced:', error);
  }
}

/**
 * Handle email complaint events (marked as spam)
 */
async function handleEmailComplained(event: ResendWebhookEvent) {
  try {
    const { email_id, to } = event.data;
    const recipient: string = (to && to.length > 0) ? to[0] || '' : '';

    console.log(`🚨 Email complaint: ${email_id} marked as spam by ${recipient}`);

    const metadata = JSON.stringify(event);

    await sql`
      INSERT INTO email_metrics (email_id, type, status, recipient, complaint_at, metadata)
      VALUES (
        ${email_id}, 'unknown', 'complained', ${recipient},
        NOW(), ${metadata}
      )
      ON CONFLICT (email_id)
      DO UPDATE SET
        status = 'complained',
        complaint_at = NOW(),
        updated_at = NOW()
    `;

  } catch (error) {
    console.error('Error handling email complaint:', error);
  }
}

/**
 * Handle email marked as spam
 */
async function handleEmailSpam(event: ResendWebhookEvent) {
  try {
    const { email_id, to } = event.data;
    const recipient: string = to ? to[0] || '' : '';

    console.log(`🚫 Email marked as spam: ${email_id} by ${recipient}`);

    const metadata = JSON.stringify(event);

    await sql`
      INSERT INTO email_metrics (email_id, type, status, recipient, complaint_at, metadata)
      VALUES (
        ${email_id}, 'unknown', 'spam', ${recipient},
        NOW(), ${metadata}
      )
      ON CONFLICT (email_id)
      DO UPDATE SET
        status = COALESCE(email_metrics.status, 'spam'),
        complaint_at = NOW(),
        updated_at = NOW()
    `;

  } catch (error) {
    console.error('Error handling email spam:', error);
  }
}
