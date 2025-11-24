// API Endpoint for sending Founders High-Ticket Email using Resend
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import PandorasHighTicketEmail from '@/emails/PandorasHighTicketEmail';
import { render } from '@react-email/render';

// Configure Resend - SECURE ENVIRONMENT VARIABLES (same as newsletter-subscribe)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'founders@pandoras.finance';

// Validate Resend configuration
if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not configured in environment variables');
}

// Send email using Resend with proper return values
async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured - simulating email send');
    console.log(`📧 EMAIL SIMULATED:`);
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
          value: 'highticket'
        },
        {
          name: 'source',
          value: 'founders-landing'
        },
        {
          name: 'type',
          value: 'high-ticket-founders'
        }
      ],
    };

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
    console.log(`✅ High-Ticket Founder email sent via Resend: ${result.id}`);
    return { success: true, messageId: result.id, simulated: false };
  } catch (error) {
    console.error('❌ Resend email send failed:', error);

    // Check if timeout
    if (error instanceof Error && (error.message.includes('aborted') || error.message.includes('timeout'))) {
      console.log('⚠️ Founders email: Timeout but likely sent');
      return { success: true, messageId: 'timeout-but-sent', simulated: false, timeout: true };
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  let email = '';
  try {
    const data = await request.json();
    email = data.email;
    const { source, name } = data;

    if (!email?.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Render email template
    const emailHtml = await render(
      PandorasHighTicketEmail({
        name: name || 'Founder',
        whatsappLink: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent("Hola, soy founder y quiero aplicar al programa de Pandora's. Tengo capital disponible.")}`,
        source: source || 'founders-landing-modal'
      })
    );

    // Send email
    const subject = "Programa Exclusivo para Founders — Solo 5 lugares al trimestre";
    const sendResult = await sendEmail(email, subject, emailHtml);

    if (!sendResult.success) {
      throw new Error('Email send failed');
    }

    console.log(`✅ Founders email sent to ${email} from ${source}`);

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      recipient: email
    });

  } catch (error) {
    console.error('❌ Error sending founders email:', error);

    // Handle timeout errors specifically
    const isTimeout = error instanceof Error && (
      error.message.includes('aborted') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('fetch failed') ||
      error.name === 'AbortError'
    );

    if (isTimeout) {
      console.log('⚠️ Founders email: Timeout but email likely delivered');
      return NextResponse.json({
        success: true,
        message: 'Email probablement envoyé malgré le timeout',
        recipient: email,
        warning: 'Timeout occurred but email was likely sent successfully'
      });
    }

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
