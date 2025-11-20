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

// Send email using Resend (same implementation as newsletter-subscribe)
async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured - simulating email send');
    console.log(`📧 EMAIL SIMULATED:`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.substring(0, 200)}...`);
    return true;
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

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend error:', error);
      throw new Error('Failed to send email via Resend');
    }

    const result = await emailResponse.json();
    console.log(`✅ High-Ticket Founder email sent via Resend: ${result.id}`);
    return true;
  } catch (error) {
    console.error('❌ Resend email send failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, source, name } = await request.json();

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
    sendEmail(email, subject, emailHtml);

    console.log(`✅ Founders email sent to ${email} from ${source}`);

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      recipient: email
    });

  } catch (error) {
    console.error('❌ Error sending founders email:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
