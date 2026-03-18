import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import PandorasWelcomeEmail from '@/emails/creator-email';
import { syncLeadAsClient } from '@/actions/leads';
import { notifyNewsletterSubscription } from '@/lib/discord';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, source, tags, metadata } = body;

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 });
        }

        console.log(`📧 Processing Creator Welcome for: ${email}`);

        // 1. Sync Lead as Client (unified - replaces whatsappPreapplyLeads insert)
        try {
            await syncLeadAsClient({
                email,
                name: name || 'Creator',
                source: source || 'start_landing',
                metadata: {
                    tags,
                    ...metadata,
                }
            });
            console.log('✅ Lead synced to clients table');
        } catch (dbError) {
            console.warn('⚠️ Lead sync issue (non-blocking):', dbError);
        }

        // 2. Send Email
        try {
            const { error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: [email],
                subject: 'Tu Dossier Técnico de Protocolos — Pandora\'s',
                react: PandorasWelcomeEmail({
                    email,
                    name: name || 'Creador',
                    source: source || 'landing-start'
                }),
                tags: [{ name: 'audience', value: 'creator_welcome' }]
            });

            if (error) {
                console.error('❌ Resend Error:', error);
                return NextResponse.json({ message: 'Error sending email', error }, { status: 500 });
            }
            console.log('✅ Email sent successfully');
        } catch (emailError) {
            console.error('❌ Email Logic Error:', emailError);
            return NextResponse.json({ message: 'Error sending email' }, { status: 500 });
        }

        // 3. Notify Discord
        try {
            await notifyNewsletterSubscription(email, source || 'start_landing');
        } catch (discordError) {
            console.warn('⚠️ Discord notification issue (non-blocking):', discordError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Server Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
