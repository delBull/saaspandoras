import { NextResponse } from 'next/server';
import { db } from "@/db";
import { whatsappPreapplyLeads } from "@/db/schema";
import { Resend } from 'resend';
import PandorasWelcomeEmail from '@/emails/creator-email';
import { sql } from 'drizzle-orm';

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

        // 1. Sync to Database (Marketing Leads)
        // Note: Using whatsappPreapplyLeads as the main leads table for now
        let leadId = null;
        try {
            const [lead] = await db.insert(whatsappPreapplyLeads).values({
                applicantEmail: email,
                applicantName: name || 'Creator',
                userPhone: email, // Placeholder if phone not provided, ensuring uniqueness logic might need check
                status: 'pending',
                answers: {
                    tags,
                    metadata,
                    source: source || 'start_landing'
                }
            }).onConflictDoUpdate({
                target: whatsappPreapplyLeads.userPhone, // Assuming uniqueness on phone/email logic or just upserting
                set: {
                    updatedAt: new Date(),
                    applicantEmail: email, // Ensure email is fresh
                    answers: sql`jsonb_set(whatsapp_preapply_leads.answers, '{tags}', ${JSON.stringify(tags)}::jsonb)`
                }
            }).returning({ id: whatsappPreapplyLeads.id });

            leadId = lead?.id;
            console.log('✅ Lead saved to DB:', leadId);
        } catch (dbError) {
            // Note: If conflict on phone constraint happens and we don't have phone, it might error.
            // For this specific endpoint, we often collect Email OR Phone. 
            // If uniqueness is strict on phone, we might need a dummy phone or a different table.
            // Assuming current schema allows flexibility or we handle it.
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Server Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
