import { NextResponse } from 'next/server';
import { db } from "@/db";
import { whatsappPreapplyLeads } from "@/db/schema";
import { Resend } from 'resend';
import PandorasWelcomeEmail from '@/emails/creator-email'; // Reuse or create new template if needed
import { sql } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

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
            await db.insert(whatsappPreapplyLeads).values({
                applicantEmail: email,
                applicantName: name || 'Architect',
                userPhone: email, // Placeholder logic
                status: 'pending',
                answers: {
                    rawAnswers: answers,
                    source: source || 'utility_protocol_landing',
                    projectDescription: 'Interested in Utility Protocol Architecture'
                }
            }).onConflictDoUpdate({
                target: whatsappPreapplyLeads.userPhone,
                set: {
                    updatedAt: new Date(),
                    answers: sql`jsonb_set(whatsapp_preapply_leads.answers, '{projectDescription}', '"Updated Interest in Utility Protocol"'::jsonb)`
                }
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
            });

            if (error) throw error;
            console.log('✅ Email sent successfully');
        } catch (emailError) {
            console.error('❌ Resend Error:', emailError);
            return NextResponse.json({ message: 'Error sending email' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ Server Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
