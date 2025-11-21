import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
    // 1. Verify webhook signature (if secret is provided)
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get('X-Resend-Signature')!;
      const timestamp = request.headers.get('X-Resend-Signature-Timestamp')!;
      const body = await request.text();

      if (!signature || !timestamp) {
        console.warn('⚠️ Missing webhook signature headers');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }

      // Verify signature (implement if needed)
      // const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET)
      //   .update(`${timestamp}.${body}`)
      //   .digest('hex');

      // if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      //   console.warn('⚠️ Invalid webhook signature');
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      // }
    }

    // 2. Parse webhook payload
    const rawBody = await request.text();
    const payload: ResendWebhookEvent = JSON.parse(rawBody);

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

/**
 * Handle email delivered events
 */
function handleEmailDelivered(event: ResendWebhookEvent) {
  try {
    const { email_id, to, subject, created_at } = event.data;

    console.log(`✅ Email delivered: ${email_id} to ${to.join(', ')}`);

    // TODO: Store in database for metrics
    // - Update email status to 'delivered'
    // - Record delivery timestamp
    // - Update delivery counts

    // For now, just log the event
    // You would typically have a database table to track email events

  } catch (error) {
    console.error('Error handling email delivered:', error);
  }
}

/**
 * Handle email opened events
 */
function handleEmailOpened(event: ResendWebhookEvent) {
  try {
    const { email_id, to, user_agent, ip } = event.data;

    console.log(`👁️ Email opened: ${email_id} by ${to[0]} from ${ip}`);

    // TODO: Store in database
    // - Record open timestamp
    // - Track unique opens vs total opens
    // - Store user agent and IP for analytics

  } catch (error) {
    console.error('Error handling email opened:', error);
  }
}

/**
 * Handle email clicked events
 */
function handleEmailClicked(event: ResendWebhookEvent) {
  try {
    const { email_id, to, url, link, ip } = event.data;

    console.log(`👆 Email clicked: ${email_id} - ${url} by ${to[0]}`);

    // TODO: Store in database
    // - Record click timestamp and URL
    // - Track click-through rates
    // - Store referrer information

  } catch (error) {
    console.error('Error handling email clicked:', error);
  }
}

/**
 * Handle email bounced events
 */
function handleEmailBounced(event: ResendWebhookEvent) {
  try {
    const { email_id, to, bounce_type, bounce_code, error_message } = event.data;

    console.log(`❌ Email bounced: ${email_id} to ${to[0]} - ${bounce_type}`);

    // TODO: Store in database
    // - Mark email as bounced
    // - Store bounce type and reason
    // - Update bounce rate metrics

  } catch (error) {
    console.error('Error handling email bounced:', error);
  }
}

/**
 * Handle email complaint events (marked as spam)
 */
function handleEmailComplained(event: ResendWebhookEvent) {
  try {
    const { email_id, to } = event.data;

    console.log(`🚨 Email complaint: ${email_id} marked as spam by ${to[0]}`);

    // TODO: Store in database
    // - Record spam complaints
    // - Update sender reputation metrics
    // - Flag recipient for suppression

  } catch (error) {
    console.error('Error handling email complaint:', error);
  }
}

/**
 * Handle email marked as spam
 */
function handleEmailSpam(event: ResendWebhookEvent) {
  try {
    const { email_id, to } = event.data;

    console.log(`🚫 Email marked as spam: ${email_id} by ${to[0]}`);

    // Similar to complaint handling

  } catch (error) {
    console.error('Error handling email spam:', error);
  }
}
