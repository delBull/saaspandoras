import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Configure Resend - SECURE ENVIRONMENT VARIABLES
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@pandoras.finance';

// Validate Resend configuration
if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not configured in environment variables');
}

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
    const { email, name, source, tags, language, metadata } = body;

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

        // Send email via Resend with React Email template
    if (RESEND_API_KEY && contactEmail) {
      try {
        // Import React Email render function from correct package
        const { render } = await import('@react-email/render');
        const PandorasWelcomeEmail = (await import('@/emails/creator-email')).default;

        // Render the React Email to HTML (render is async in @react-email/render)
        const html = await render(
          PandorasWelcomeEmail({
            email: contactEmail,
            name: name,
            source: source,
          })
        );

        console.log('HTML render result type:', typeof html);
        console.log('HTML render result (first 200 chars):', html.substring(0, 200));

        // Validate that we got a valid HTML string
        if (!html || typeof html !== 'string' || html.trim().length === 0) {
          console.error('Email render failed - empty or invalid HTML');
          throw new Error('Failed to render email HTML');
        }

        const emailData = {
          from: FROM_EMAIL,
          to: [contactEmail],
          subject: '¡Bienvenido a Pandora\'s - La Evolución del Creador!',
          html: html,
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
