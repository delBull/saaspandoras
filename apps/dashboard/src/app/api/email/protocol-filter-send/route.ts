// API Endpoint for sending Protocol Filter High-Ticket Email using Resend
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import PandorasProtocolFilterEmail from '@/emails/PandorasProtocolFilterEmail';
import { render } from '@react-email/render';

// Configure Resend - SECURE ENVIRONMENT VARIABLES
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'arquitectura@pandoras.finance';

// Validate Resend configuration
if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not configured in environment variables');
}

// Send email using Resend
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
          value: 'protocol-filter'
        },
        {
          name: 'source',
          value: 'utility-protocol-page'
        },
        {
          name: 'type',
          value: 'protocol-viability-filter'
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
    console.log(`✅ Protocol Filter email sent via Resend: ${result.id}`);
    return true;
  } catch (error) {
    console.error('❌ Resend email send failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, source, name, answers } = await request.json();

    if (!email?.includes('@')) {
      return NextResponse.json(
        { error: 'Email válido requerido' },
        { status: 400 }
      );
    }

    // WhatsApp link - EXACT SAME as utility-protocol page WhatsAppUtilityLeadForm
    const whatsappLink = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(
      "Estoy interesado en crear un utility protocol funcional"
    )}`;

    // Render email template
    const emailHtml = await render(
      PandorasProtocolFilterEmail({
        name: name || 'Creador',
        whatsappLink: whatsappLink,
        applyLink: 'https://dash.pandoras.finance/apply'
      })
    );

    const subject = "Análisis de Viabilidad Funcional - Protocolo de Utilidad";

    // Log the filter answers for processing
    console.log('🎯 PROTOCOL FILTER SUBMISSION:', {
      email,
      name: name || 'Creador',
      source,
      answers,
      timestamp: new Date().toISOString()
    });

    // Send email
    await sendEmail(email, subject, emailHtml);

    console.log(`✅ Protocol filter email sent to ${email} from ${source}`);

    return NextResponse.json({
      success: true,
      message: 'Filtro procesado exitosamente. Email enviado.',
      recipient: email,
      whatsappLink: whatsappLink
    });

  } catch (error) {
    console.error('❌ Error sending protocol filter email:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
