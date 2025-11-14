import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Configure Resend - PRODUCTION READY
// API Key: re_bqdhCmVr_85rh4Uvw5F6QtVtfsbJDKgmG
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? 're_bqdhCmVr_85rh4Uvw5F6QtVtfsbJDKgmG';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@pandoras.finance';

// Database configuration - Environment-specific
const NODE_ENV = process.env.NODE_ENV || 'development';
const environment = process.env.VERCEL_ENV ?? NODE_ENV;
let SUPABASE_URL: string | undefined;
let SUPABASE_SERVICE_KEY: string | undefined;

// Choose database configuration based on environment
if (environment === 'production') {
  SUPABASE_URL = process.env.PROD_SUSCRIBERS_SUPABASE_URL;
  SUPABASE_SERVICE_KEY = process.env.PROD_SUSCRIBERS_SUPABASE_SERVICE_ROLE_KEY;
} else if (environment === 'staging') {
  SUPABASE_URL = process.env.DEV_SUSCRIBERS_SUPABASE_URL;
  SUPABASE_SERVICE_KEY = process.env.DEV_SUSCRIBERS_SUPABASE_SERVICE_ROLE_KEY;
} else {
  // Development - use DEV_SUSCRIBERS or fallback to console
  SUPABASE_URL = process.env.DEV_SUSCRIBERS_SUPABASE_URL;
  SUPABASE_SERVICE_KEY = process.env.DEV_SUSCRIBERS_SUPABASE_SERVICE_ROLE_KEY;
}

// Database interface
interface Subscriber {
  email: string;
  phone?: string;
  source: string;
  tags: string[];
  language?: string;
  metadata: Record<string, unknown>;
  is_confirmed?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source, tags, language, metadata } = body;

    // Validate email
    if (!email?.includes('@')) {
      return NextResponse.json(
        { message: 'Email válido requerido' },
        { status: 400 }
      );
    }

    // Determine if this is an email or phone number
    const isEmail = email.includes('@');
    const contactEmail = isEmail ? email : null;
    const phoneNumber = !isEmail ? email : null;

    // Prepare subscriber data
    const subscriberData: Subscriber = {
      email: contactEmail ?? email,
      phone: phoneNumber,
      source: source || 'unknown',
      tags: tags || [],
      language: language || 'es',
      metadata: metadata || {},
      is_confirmed: false
    };

    // Save to database if Supabase is configured
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(subscriberData)
        });

        if (!supabaseResponse.ok) {
          const errorText = await supabaseResponse.text();
          console.error('Supabase error:', errorText);
          // Continue with email sending even if DB fails
        }
      } catch (dbError) {
        console.error('Database save failed:', dbError);
        // Continue with email sending even if DB fails
      }
    }

    // Send email via Resend
    if (RESEND_API_KEY && contactEmail) {
      try {
        const emailData = {
          from: FROM_EMAIL,
          to: [contactEmail],
          subject: '¡Bienvenido a Pandora\'s - La Evolución del Creador!',
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 32px; margin: 0; background: linear-gradient(45deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">¡Bienvenido, Futuro Creador!</h1>
              </div>
              
              <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
                <h2 style="color: #a3e635; margin-top: 0;">La Evolución del Creador ya comenzó</h2>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  ¡Gracias por unirte a la revolución de las comunidades soberanas! 🎉
                </p>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  Estás a punto de descubrir cómo <strong>transformar audiencias pasivas en comunidades activas</strong> mediante protocolos de utilidad, membresías NFT y sistemas Work-to-Earn.
                </p>
                
                <div style="background: linear-gradient(45deg, #1e293b, #334155); padding: 20px; border-radius: 10px; margin: 25px 0;">
                  <h3 style="color: #3b82f6; margin-top: 0;">🔮 Próximamente recibirás:</h3>
                  <ul style="padding-left: 20px;">
                    <li>Guías paso a paso para crear tu primer protocolo</li>
                    <li>Plantillas de contratos pre-auditados</li>
                    <li>Casos de estudio de creadores exitosos</li>
                    <li>Acceso prioritario a nuevas funcionalidades</li>
                  </ul>
                </div>
                
                <p style="font-size: 14px; color: #94a3b8; font-style: italic;">
                  Mientras tanto, puedes comenzar explorando nuestra plataforma en desarrollo. 
                  ¿Alguna pregunta? Responde a este email y te ayudaremos personalmente.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #64748b; font-size: 12px;">
                  © 2025 Pandora's Finance. Construyendo el futuro de las comunidades digitales.
                </p>
              </div>
            </div>
          `
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
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue even if email fails
      }
    }

    // Log the subscription (backup)
    console.log('Newsletter Subscription:', {
      email: contactEmail || email,
      phone: phoneNumber,
      source,
      tags,
      language,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      database_status: SUPABASE_URL ? 'configured' : 'not_configured'
    });

    return NextResponse.json({
      success: true,
      message: '¡Suscripción exitosa! Revisa tu email.',
      data: {
        email: contactEmail || email,
        phone: phoneNumber,
        source,
        tags,
        timestamp: new Date().toISOString(),
        email_sent: !!RESEND_API_KEY && !!contactEmail,
        database_saved: !!(SUPABASE_URL && SUPABASE_SERVICE_KEY)
      }
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Error interno del servidor. Inténtalo más tarde.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}