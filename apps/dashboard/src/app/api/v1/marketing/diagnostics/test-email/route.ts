import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, FROM_EMAIL } from '@saasfly/shared';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/marketing/diagnostics/test-email
 * 
 * Simple endpoint to verify Resend connectivity.
 */
export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();
    if (!to) return NextResponse.json({ error: 'Missing "to" email' }, { status: 400 });

    const apiKeyExists = !!process.env.RESEND_API_KEY;
    console.log(`[DIAGNOSTIC] 🧪 Testing Resend. API Key Exists: ${apiKeyExists}, From: ${FROM_EMAIL}, To: ${to}`);

    if (!apiKeyExists) {
        return NextResponse.json({ error: 'RESEND_API_KEY is missing in this environment' }, { status: 500 });
    }

    const result = await sendEmail({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Growth OS Diagnostic: Resend Connection Test',
      html: `
        <h1>Diagnostic Success</h1>
        <p>This email confirms that your Resend integration is correctly configured for <strong>${FROM_EMAIL}</strong>.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });

    if (!result.success) {
      console.error('[DIAGNOSTIC] ❌ Resend Error:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { id: result.id } });
  } catch (err) {
    console.error('[DIAGNOSTIC] ❌ System Error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
