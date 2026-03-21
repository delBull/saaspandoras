import { NextResponse } from 'next/server';
import { notifyNewLead } from '@/lib/discord';
import { syncLeadAsClient } from '@/actions/leads';
import PandorasWelcomeEmail from '@/emails/creator-email';
import { resend, FROM_EMAIL } from '@/lib/resend';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, source } = body;

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 });
        }

        console.log(`📧 Processing Founders Inquiry for: ${email}`);

        // 1. Sync Lead as Client (unified)
        try {
            await syncLeadAsClient({
                email,
                name: name || 'Founder',
                source: source || 'founders_landing',
                notes: 'High Ticket Founder Inquiry (Capital Ready)',
                metadata: {
                    tier: 'founders_premium',
                    source: source || 'founders_landing',
                }
            });
            console.log('✅ Lead synced to clients table');
        } catch (e) {
            console.warn('⚠️ DB Sync warning:', e);
        }

        // 2. Send Confirmation Email
        try {
            const { error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: [email],
                subject: 'Pandora\'s Founders Inner Circle — Confirmación de Interés',
                react: PandorasWelcomeEmail({
                    email,
                    name: 'Founder',
                    source: 'founders-program',
                }),
                tags: [{ name: 'audience', value: 'founders' }]
            });

            if (error) throw error;
            console.log('✅ Email sent successfully');
        } catch (emailError) {
            console.error('❌ Resend Error:', emailError);
            return NextResponse.json({ message: 'Error sending email' }, { status: 500 });
        }

        // 3. Notify Discord (High Ticket Lead)
        try {
            await notifyNewLead(
                name || 'Founder Premium',
                email,
                10, // Fixed high score for founders
                'Founders Inner Circle',
                `High Ticket Inquiry from ${source || 'Founders Landing'}. Project: ${name || 'N/A'}`
            );
            console.log('👾 Discord notification sent (Founders)');
        } catch (discordError) {
            console.error('❌ Discord Error:', discordError);
        }

        return NextResponse.json({ success: true });


    } catch (error) {
        console.error('❌ Server Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
