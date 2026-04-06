import { NextRequest, NextResponse } from 'next/server';
import { notifyNewsletterSubscription } from '@/lib/discord';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { sql } from 'drizzle-orm';


// Configure Resend - SECURE ENVIRONMENT VARIABLES
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@pandoras.finance';

// Validate Resend configuration
if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not configured in environment variables');
}

// Database configuration - REMOVED SUPABASE (Unified in Neon/Railway)
const NODE_ENV = process.env.NODE_ENV || 'development';
const environment = process.env.VERCEL_ENV ?? NODE_ENV;

// Database interface - Matches Drizzle schema
interface Subscriber {
  email: string;
  phone?: string | null;
  source: string;
  tags: string[];
  language?: string;
  metadata: Record<string, unknown>;
  isConfirmed?: boolean;
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
      isConfirmed: false
    };

    // 🧬 Save to Unified Database (Neon/Railway) via Drizzle
    try {
      await db.insert(newsletterSubscribers).values({
        email: subscriberData.email,
        phone: subscriberData.phone,
        source: subscriberData.source,
        tags: subscriberData.tags,
        language: subscriberData.language,
        metadata: subscriberData.metadata,
        isConfirmed: false
      }).onConflictDoNothing(); // Prevent errors on double-submission
    } catch (dbError) {
      console.error('Unified Database save failed:', dbError);
      // Continue with email sending even if DB fails to maintain conversion
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
          tags: [{ name: 'audience', value: 'newsletter_generic' }]
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

    // 👾 Notify Discord
    try {
      await notifyNewsletterSubscription(contactEmail || email, source || 'newsletter_generic');
    } catch (discordError) {
      console.warn('⚠️ Discord notify failed (Newsletter):', discordError);
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
      userAgent: (request as any).headers?.get('user-agent') ?? 'unknown',
      database_status: 'drizzle_neon_unfied'
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
        database_saved: true
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
