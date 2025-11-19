// API Endpoint for sending Founders High-Ticket Email
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { render } from '@react-email/render';
import PandorasHighTicketEmail from '@/emails/PandorasHighTicketEmail';

// Simple email sending simulation (replace with actual email service like Resend, SendGrid, etc.)
function sendEmail(to: string, subject: string, html: string) {
  // TODO: Replace with actual email service
  // For now, just log it
  console.log(`📧 EMAIL SENT:`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${html.substring(0, 200)}...`);

  // Simulate successful send
  return true;
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
        whatsappLink: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_CONTACT || '5213117348048'}?text=Quiero%20hablar%20sobre%20el%20Founders%20Program`,
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
