import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ambassadors, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendAmbassadorAlert } from '@/lib/discord/alert-notifier';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';

async function handler(req: Request) {
    try {
        const body = await req.json();
        const { email, pin } = body;

        if (!email || !pin) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const emailLower = email.toLowerCase().trim();

        const ambassador = await db.query.ambassadors.findFirst({
            where: and(
                eq(ambassadors.email, emailLower),
                eq(ambassadors.verificationToken, pin)
            )
        });

        if (!ambassador) {
            return NextResponse.json({ error: 'PIN incorrecto o expirado' }, { status: 400 });
        }

        // 1. Update verification status
        await db.update(ambassadors)
            .set({ 
                emailVerified: true, 
                verificationToken: null,
                updatedAt: new Date()
            })
            .where(eq(ambassadors.id, ambassador.id));

        // 2. Send Discord Alert (only after verified!)
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
            message: 'Email verificado exitosamente.'
        });

    } catch (error: any) {
        console.error('[Ambassador Verify API Error]:', error);
        return NextResponse.json({ error: 'Error interno verificando el PIN' }, { status: 500 });
    }
}

export const POST = withSecurity(handler, { rateLimit: apiRateLimiter });
