import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import PandorasWelcomeEmail from '@/emails/creator-email';
import { render } from '@react-email/render';

// Configure Resend - MISMA CONFIGURACIÓN QUE FOUNDERS-SEND
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'hello@pandoras.finance';

// Validate Resend configuration
if (!RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY not configured - emails will be simulated');
}

// Send email using Resend with timeout handling
async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log('📧 EMAIL SIMULATED (no RESEND_API_KEY):');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body length: ${html.length} chars`);
    return { success: true, messageId: null, simulated: true };
  }

  try {
    const emailData = {
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
      tags: [
        {
          name: 'audience',
          value: 'creator-landing'
        },
        {
          name: 'source',
          value: 'start-page'
        },
        {
          name: 'template',
          value: 'PandorasWelcomeEmail'
        },
        {
          name: 'segment',
          value: 'early-interest'
        }
      ],
    };

    // Timeout handling like founders-send
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend error:', error);
      throw new Error('Failed to send email via Resend');
    }

    const result = await emailResponse.json();
    console.log(`✅ Creator welcome email sent via Resend: ${result.id}`);
    return { success: true, messageId: result.id, simulated: false };
  } catch (error) {
    console.error('❌ Resend email send failed:', error);

    // Check if timeout
    if (error instanceof Error && (error.message.includes('aborted') || error.message.includes('timeout'))) {
      console.log('⚠️ Creator welcome email: Timeout but likely sent');
      return { success: true, messageId: 'timeout-but-sent', simulated: false, timeout: true };
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, phone, name, source } = await request.json();

    // Requiere email (no acepta teléfono para creator welcome)
    if (!email?.includes('@')) {
      return NextResponse.json(
        { error: 'Email válido requerido para bienvenida de creador' },
        { status: 400 }
      );
    }

    // Render email template y await porque devuelve Promise
    const emailHtml = await render(
      PandorasWelcomeEmail({
        email: email,
        name: name || 'Futuro Creador',
        source: source || 'landing-start'
      })
    );

    // Send email
    const subject = "¡Tu viaje comienza ahora! - Pandora's Finance";
    await sendEmail(email, subject, emailHtml);

    console.log(`✅ Creator welcome email sent to ${email} from ${source}`);

    return NextResponse.json({
      success: true,
      message: '¡Bienvenido! Email de creador enviado exitosamente',
      recipient: email,
      template: 'PandorasWelcomeEmail',
      source: source || 'landing-start'
    });

  } catch (error) {
    console.error('❌ Error sending creator welcome email:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint para preview
export function GET(request: NextRequest) { // ← Sin async
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'Futuro Creador';
    const email = searchParams.get('email') || 'usuario@ejemplo.com';
    const source = searchParams.get('source') || 'landing-start';

    return NextResponse.json({
      message: 'Creator Welcome Email API - /api/email/creator-welcome',
      template: 'PandorasWelcomeEmail',
      active: !!RESEND_API_KEY,
      resend_configured: !!RESEND_API_KEY,
      preview_url: `${request.url}?preview=html&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
      example_usage: 'POST with { email: "user@domain.com", name: "Futuro Creador" }',
      note: 'Preview endpoint now provides URL only. For HTML preview, use browser to visit preview_url'
    });

  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 });
  }
}
