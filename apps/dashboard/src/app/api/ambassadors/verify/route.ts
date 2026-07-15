import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ambassadors, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendAmbassadorAlert } from '@/lib/discord/alert-notifier';
import { sendAmbassadorWelcomeEmail } from '@/lib/email/ambassador-mailer';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';

// In-memory PIN attempt tracking per email (resets on server restart)
const pinAttempts = new Map<string, { count: number; lastAttempt: number }>();

async function handler(req: Request) {
    try {
        const body = await req.json();
        const { email, pin } = body;

        if (!email || !pin) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const emailLower = email.toLowerCase().trim();

        // Rate limit: max 5 attempts per email per hour
        const now = Date.now();
        const attempts = pinAttempts.get(emailLower);
        if (attempts) {
            if (attempts.count >= 5 && (now - attempts.lastAttempt) < 3600000) {
                return NextResponse.json({
                    error: 'Demasiados intentos. Espera 1 hora antes de intentar de nuevo.'
                }, { status: 429 });
            }
            if ((now - attempts.lastAttempt) >= 3600000) {
                pinAttempts.delete(emailLower);
            }
        }

        const ambassador = await db.query.ambassadors.findFirst({
            where: and(
                eq(ambassadors.email, emailLower),
                eq(ambassadors.verificationToken, pin)
            )
        });

        if (!ambassador) {
            const currentAttempts = (pinAttempts.get(emailLower)?.count || 0) + 1;
            pinAttempts.set(emailLower, { count: currentAttempts, lastAttempt: now });
            const remaining = Math.max(0, 5 - currentAttempts);
            return NextResponse.json({
                error: remaining > 0
                    ? `PIN incorrecto. Te quedan ${remaining} intento${remaining === 1 ? '' : 's'}.`
                    : 'Demasiados intentos. Espera 1 hora antes de intentar de nuevo.'
            }, { status: 400 });
        }

        // Check PIN expiration (15-minute window)
        if (ambassador.verificationExpiresAt && new Date() > new Date(ambassador.verificationExpiresAt)) {
            pinAttempts.delete(emailLower);
            return NextResponse.json({
                error: 'El PIN ha expirado. Solicita un nuevo código.'
            }, { status: 400 });
        }

        // Clear rate limit on success
        pinAttempts.delete(emailLower);

        // 1. Update verification status
        await db.update(ambassadors)
            .set({ 
                emailVerified: true, 
                verificationToken: null,
                verificationExpiresAt: null,
                updatedAt: new Date()
            })
            .where(eq(ambassadors.id, ambassador.id));

        // 2. Send Welcome Email (identity matches ambassador origin)
        await sendAmbassadorWelcomeEmail({
            ambassadorName: ambassador.fullName,
            ambassadorEmail: ambassador.email,
            referralCode: ambassador.referralCode,
            origin: ambassador.origin
        }).catch((err) => {
            console.error('[Ambassador Verify] Failed to send welcome email:', err);
        });

        // 3. Send Discord Alert (only after verified!)
        let projectWebhookUrl = null;
        if (ambassador.projectId) {
            const projectData = await db.query.projects.findFirst({
                where: eq(projects.id, ambassador.projectId)
            });
            if (projectData?.discordWebhookUrl) {
                projectWebhookUrl = projectData.discordWebhookUrl;
            }
        }
        await sendAmbassadorAlert(ambassador, projectWebhookUrl).catch(() => {});

        return NextResponse.json({
            success: true,
            message: 'Email verificado exitosamente.',
            referralCode: ambassador.referralCode
        });

    } catch (error: any) {
        console.error('[Ambassador Verify API Error]:', error);
        return NextResponse.json({ error: 'Error interno verificando el PIN' }, { status: 500 });
    }
}

export const POST = withSecurity(handler, { rateLimit: apiRateLimiter });
