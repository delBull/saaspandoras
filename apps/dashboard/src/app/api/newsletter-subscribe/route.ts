import { NextRequest, NextResponse } from 'next/server';
import { notifyNewsletterSubscription } from '@/lib/discord';
import { db } from '@saasfly/db';
import { newsletterSubscribers } from '@saasfly/db/schema';
import { sql } from "@saasfly/db-core";


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
    let dbSaved = false;
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
      dbSaved = true;
    } catch (dbError: any) {
      console.error('Unified Database save failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Error al registrar suscripción en la base de datos.',
          database_saved: false
        },
        { status: 500 }
      );
    }

    // Send email via unified email engine
    if (contactEmail) {
      try {
        const { renderEmailAsync, sendEmail, resolveEmailBranding } = await import('@saasfly/shared');
        const PandorasWelcomeEmail = (await import('@/emails/creator-email')).default;

        const branding = await resolveEmailBranding();
        const rendered = await renderEmailAsync({
          template: PandorasWelcomeEmail as any,
          props: {
            email: contactEmail,
            name: name,
            source: source,
          },
        });

        await sendEmail({
          from: FROM_EMAIL,
          to: [contactEmail],
          subject: '¡Bienvenido a Pandora\'s - La Evolución del Creador!',
          html: rendered.html,
          text: rendered.text,
        });
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
