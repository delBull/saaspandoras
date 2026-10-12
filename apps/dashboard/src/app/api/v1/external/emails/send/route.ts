import { NextRequest, NextResponse } from 'next/server';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { sendEmail, FROM_EMAIL } from '@saasfly/shared';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawAuth = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key') || (rawAuth?.startsWith('Bearer ') ? rawAuth.substring(7) : null);

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const client = await IntegrationKeyService.validateKey(apiKey);
    if (!client) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    }

    const body = await req.json();
    const { to, subject, html, fromName = 'Pandoras Foundation' } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields (to, subject, html)' }, { status: 400 });
    }

    // Usar la función unificada de envío de Pandoras para el correo del proyecto externo
    const result = await sendEmail({
      from: `${fromName} <${FROM_EMAIL}>`,
      to: [to],
      subject: subject,
      html: html,
    });

    if (!result.success) {
      console.error('[Growth OS] ❌ Error sending external email:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.info(`[Growth OS] 📧 External email sent successfully to ${to} for project ${client.name}`);
    return NextResponse.json({ success: true, id: result.id });

  } catch (error: any) {
    console.error('[Growth OS] ❌ External Email API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
