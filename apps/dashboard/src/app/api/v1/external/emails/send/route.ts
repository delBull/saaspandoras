import { NextRequest, NextResponse } from 'next/server';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { resend, FROM_EMAIL } from '@/lib/resend';

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

    // Usar la instancia de Resend de Pandoras para enviar el correo del proyecto externo
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${FROM_EMAIL}>`,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('[Growth OS] ❌ Error sending external email:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.info(`[Growth OS] 📧 External email sent successfully to ${to} for project ${client.name}`);
    return NextResponse.json({ success: true, id: data?.id });

  } catch (error: any) {
    console.error('[Growth OS] ❌ External Email API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
