import { NextResponse } from 'next/server';
import { db } from "@/db";
import { whatsappPreapplyLeads } from "@/db/schema";
import { Resend } from 'resend';
import { sql } from 'drizzle-orm';
import { notifyNewLead } from '@/lib/discord';
// Import a specific Founders Template if exists, otherwise reuse generic or simple html
import PandorasWelcomeEmail from '@/emails/creator-email';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, source } = body;

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 });
        }

        console.log(`📧 Processing Founders Inquiry for: ${email}`);

        // 1. Sync Lead (High Ticket)
        try {
            await db.insert(whatsappPreapplyLeads).values({
                applicantEmail: email,
                applicantName: name || 'Founder',
                userPhone: email, // Placeholder
                status: 'pending',
                answers: {
                    tier: 'founders_premium',
                    source: source || 'founders_landing',
                    projectDescription: 'High Ticket Founder Inquiry (Capital Ready)'
                }
            }).onConflictDoUpdate({
                target: whatsappPreapplyLeads.userPhone,
                set: { updatedAt: new Date(), answers: sql`jsonb_set(whatsapp_preapply_leads.answers, '{projectDescription}', '"Re-inquiry Founders"'::jsonb)` }
            });
            console.log('✅ Lead synced to DB');
        } catch (e) {
            console.warn('⚠️ DB Sync warning:', e);
        }

        // 2. Send Confirmation Email
        try {
            const { error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: [email],
                subject: 'Pandora’s Founders Inner Circle — Confirmación de Interés',
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

        // 1.1 Notify Discord (High Ticket Lead)
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
