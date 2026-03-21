import { NextResponse } from 'next/server';
import { db } from "@/db";
import PandorasWelcomeEmail from '@/emails/creator-email';
import { syncLeadAsClient } from '@/actions/leads';
import { resend, FROM_EMAIL } from '@/lib/resend';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, source, answers } = body;

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 });
        }

        console.log(`📧 Processing Utility Protocol Filter for: ${email}`);

        // 1. Sync Lead
        try {
            await syncLeadAsClient({
                email,
                name: name || 'Architect',
                source: source || 'utility_protocol_landing',
                notes: `Interested in Utility Protocol Architecture. Answers: ${JSON.stringify(answers)}`,
                metadata: { answers }
            });
            console.log('✅ Lead synced to DB');
        } catch (e) {
            console.warn('⚠️ DB Sync warning:', e);
        }

        // 2. Send Email
        try {
            // Using the same template for now, but dynamic props could change content
            const { error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: [email],
                subject: 'Confirmación: Filtro de Viabilidad Utility Protocol',
                react: PandorasWelcomeEmail({
                    email,
                    name: name || 'Arquitecto',
                    source: 'utility-protocol',
                    // We can pass a specific prop here if the template supports it
                }),
                tags: [{ name: 'audience', value: 'utility' }]
            });

            if (error) throw error;
            console.log('✅ Email sent successfully');
        } catch (emailError) {
            console.error('❌ Resend Error:', emailError);
            return NextResponse.json({ message: 'Error sending email' }, { status: 500 });
        }

        // Discord notification is already handled by syncLeadAsClient

        return NextResponse.json({ success: true });


    } catch (error) {
        console.error('❌ Server Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
