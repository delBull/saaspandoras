import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { EmailMetricsRepository } from '@/lib/domain/email-metrics-repository';

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

    // Check for both Svix (current Resend standard) and legacy Resend header formats
    if (WEBHOOK_SECRET) {
      // 1. Extract Svix / Resend headers
      const signature = request.headers.get('svix-signature') ||
        request.headers.get('resend-signature') ||
        request.headers.get('x-resend-signature');
      const timestamp = request.headers.get('svix-timestamp') ||
        request.headers.get('resend-timestamp') ||
        request.headers.get('x-resend-signature-timestamp');
      const webhookId = request.headers.get('svix-id') ||
        request.headers.get('resend-webhook-id') ||
        request.headers.get('x-resend-webhook-id');

      if (!signature || !timestamp || !webhookId) {
        console.error('❌ Missing required webhook signature headers');
        return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
      }

      // 2. Prepare secret key (handle whsec_ prefix with base64 decoding per Svix spec)
      const cleanSecret = WEBHOOK_SECRET.startsWith('whsec_')
        ? WEBHOOK_SECRET.substring(6)
        : WEBHOOK_SECRET;

      let secretBuffer: Buffer;
      try {
        secretBuffer = Buffer.from(cleanSecret, 'base64');
      } catch {
        secretBuffer = Buffer.from(cleanSecret, 'utf8');
      }

      // 3. Create the signed content: ${id}.${timestamp}.${body}
      const signedContent = `${webhookId}.${timestamp}.${body}`;

      // 4. Compute expected HMAC SHA-256 signatures
      const hmacSvix = crypto.createHmac('sha256', secretBuffer).update(signedContent, 'utf8').digest('base64');
      const hmacRaw = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedContent, 'utf8').digest('base64');

      // 5. Compare signatures (svix-signature may contain multiple "v1,sig" separated by space)
      const passedSignatures = signature.split(' ').map((s) => s.trim().replace(/^v1,/, ''));
      const isValid = passedSignatures.some((sig) => {
        try {
          return (
            crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(hmacSvix)) ||
            crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(hmacRaw))
          );
        } catch {
          return false;
        }
      });

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
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
        await handleEmailDelivered(payload);
        break;
      case 'email.opened':
        await handleEmailOpened(payload);
        break;
      case 'email.clicked':
        await handleEmailClicked(payload);
        break;
      case 'email.bounced':
        await handleEmailBounced(payload);
        break;
      case 'email.complained':
        await handleEmailComplained(payload);
        break;
      case 'email.spam':
        await handleEmailSpam(payload);
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

    await EmailMetricsRepository.upsertDelivery(email_id, audienceTag, recipient, emailSubject, event);

  } catch (error) {
    console.error('Error handling email delivered:', error);
  }
}

/**
 * Handle email opened events
 */
async function handleEmailOpened(event: ResendWebhookEvent) {
  try {
    const { email_id, to, user_agent, ip, tags } = event.data;
    const recipient: string = to ? to[0] || '' : '';
    const audienceTag: string = tags?.find((tag: any) => tag.name === 'audience')?.value || 'unknown';

    console.log(`👁️ Email opened: ${email_id} by ${recipient} from ${ip}`);

    await EmailMetricsRepository.upsertOpen(email_id, audienceTag, recipient, user_agent, ip, event);

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

    await EmailMetricsRepository.upsertClick(email_id, recipient, clickedUrl, event);

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

    await EmailMetricsRepository.upsertBounce(email_id, recipient, event);

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

    await EmailMetricsRepository.upsertComplaint(email_id, recipient, event);

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

    await EmailMetricsRepository.upsertSpam(email_id, recipient, event);

  } catch (error) {
    console.error('Error handling email spam:', error);
  }
}
