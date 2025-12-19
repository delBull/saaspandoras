
import { NextResponse } from 'next/server';
import { db } from "~/db";
import { projects, whatsappPreapplyLeads } from "@/db/schema";
import { sql } from "drizzle-orm";
// import ProtocolApplicationEmail from '@/emails/protocol-application'; // Dynamic import used instead
import { sendWhatsAppMessage } from '@/lib/whatsapp/utils/client';

// Configure Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@pandoras.finance';

function calculateScore(data: any) {
    let score = 0;
    let suggestedPackage = 'Despliegue Rápido';

    // Revenue / Traction
    const revenue = data.revenue || '';
    const users = data.users || '';

    if (revenue.includes('$20k+') || users.includes('5000+')) {
        score += 3;
        suggestedPackage = 'Ecosystem Builder';
    } else if (revenue.includes('$1k') || users.includes('1000+')) {
        score += 2;
        suggestedPackage = 'Partner de Crecimiento';
    }

    // Budget
    const budget = data.budget || '';
    if (budget.includes('$50k+')) {
        score += 3;
        suggestedPackage = 'Ecosystem Builder';
    } else if (budget.includes('$10k')) {
        score += 2;
        if (suggestedPackage !== 'Ecosystem Builder') suggestedPackage = 'Partner de Crecimiento';
    }

    // Stage
    if (data.stage === 'live' || data.stage === 'mvp') {
        score += 1;
    }

    // Tech preference override
    if (data.businessModel === 'tech_only') {
        suggestedPackage = 'Despliegue Rápido';
    }

    return { score, suggestedPackage };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            projectName,
            website,
            vertical,
            stage,
            teamSize,
            doxxed,
            users,
            revenue,
            budget,
            businessModel,
            riskTolerance,
            timeline,
            whyPandora,
            contactEmail,
            contactHandle // This is likely the WhatsApp number or Telegram
        } = body;

        console.log('📝 Processing Lead:', { projectName, contactEmail });

        // 1. Calculate Score
        const { score, suggestedPackage } = calculateScore(body);

        // 2. Save to Database (Projects Table as 'pending' lead)
        // We use a generated slug to avoid collisions
        const slug = `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Prepare description with all form details
        const fullDescription = `
**Lead Application Data:**
- Vertical: ${vertical}
- Stage: ${stage}
- Team: ${teamSize}
- Doxxed: ${doxxed}
- Users: ${users}
- Revenue: ${revenue}
- Budget: ${budget}
- Model: ${businessModel}
- Risk: ${riskTolerance}
- Timeline: ${timeline}
- Why Pandora: ${whyPandora}
- Contact Handle: ${contactHandle}

**System Analysis:**
- Score: ${score}
- Suggested Package: ${suggestedPackage}
        `.trim();

        try {
            await db.insert(projects).values({
                title: projectName,
                slug: slug,
                description: fullDescription,
                status: 'pending', // Pending review
                businessCategory: 'other', // Default
                applicantName: contactHandle || 'Unknown',
                applicantEmail: contactEmail,
                applicantPhone: contactHandle, // Attempt to use handle as phone if it looks like one
                integrationDetails: JSON.stringify({ score, suggestedPackage, raw: body }),
                targetAmount: '0', // Placeholder
            });
            console.log('✅ Lead saved to DB');
        } catch (dbError) {
            console.error('⚠️ DB Error (Non-fatal):', dbError);
        }

        try {
            // 3. Send Email
            if (RESEND_API_KEY && contactEmail) {
                try {
                    const { render } = await import('@react-email/render');
                    const ProtocolApplicationEmail = (await import('@/emails/protocol-application')).default;

                    const html = await render(ProtocolApplicationEmail({ name: contactHandle || 'Futuro Creador' }));

                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${RESEND_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: FROM_EMAIL,
                            to: [contactEmail],
                            subject: 'Gracias por aplicar a Pandora’s W2E — paso siguiente',
                            html: html,
                        }),
                    });
                    console.log('📧 Email sent successfully');
                } catch (emailError) {
                    console.error('❌ Failed to send email:', emailError);
                }
            }

            // 3.1 Notify Discord (Async, verify logic inside utility)
            try {
                const { notifyNewLead } = await import('@/lib/discord');
                // Notify without awaiting to prevent blocking
                notifyNewLead(
                    projectName,
                    contactEmail || 'No Email',
                    score,
                    suggestedPackage,
                    fullDescription
                ).catch(err => console.error('Discord Error:', err));
                console.log('👾 Discord notification sent');
            } catch (discordError) {
                console.error('❌ Failed to send Discord:', discordError);
            }

            // 4. Trigger WhatsApp Flow (Step 1: Welcome)
            // We assume contactHandle might be a phone number. We strip non-numeric chars.
            // In a real app we'd validate this rigorously.
            const phone = contactHandle?.replace(/\D/g, '');

            if (phone && phone.length >= 10) {
                try {
                    // Initialize Session in DB for 'protocol_application' flow
                    // This ensures the next reply is routed correctly
                    await db.execute(sql`
                    INSERT INTO whatsapp_users (phone, name, priority_level)
                    VALUES (${phone}, ${projectName || 'Lead'}, 'normal')
                    ON CONFLICT (phone) DO UPDATE SET name = ${projectName || 'Lead'};
                `);

                    // Get User ID
                    const userResult = await db.execute(sql`SELECT id FROM whatsapp_users WHERE phone = ${phone}`);
                    const user = userResult[0] as any;

                    if (user) {
                        // Set Active Session to 'protocol_application'
                        await db.execute(sql`
                        INSERT INTO whatsapp_sessions (user_id, flow_type, state, current_step, is_active)
                        VALUES (${user.id}, 'protocol_application', '{}'::jsonb, 1, true)
                        ON CONFLICT (user_id, flow_type)
                        DO UPDATE SET is_active = true, current_step = 1, updated_at = now();
                    `);

                        // Disable other sessions
                        await db.execute(sql`
                        UPDATE whatsapp_sessions SET is_active = false 
                        WHERE user_id = ${user.id} AND flow_type != 'protocol_application';
                    `);

                        // Send Welcome Message
                        const welcomeMsg = `Hola ${contactHandle || ''} 👋 ¡Gracias por aplicar a Pandora’s W2E!\n¿Puedo confirmarte tu nombre completo y el nombre del proyecto?\n\nResponde con 'Sí'.`;
                        await sendWhatsAppMessage(phone, welcomeMsg);
                        console.log('📱 WhatsApp welcome sent');
                    }

                    // Sync with Marketing Engine (WhatsApp Leads Table)
                    try {
                        await db.insert(whatsappPreapplyLeads).values({
                            userPhone: phone,
                            applicantName: projectName || 'Lead',
                            applicantEmail: contactEmail,
                            status: 'pending',
                            answers: {
                                projectDescription: fullDescription,
                                source: 'protocol_landing',
                                rawStats: { score, suggestedPackage }
                            }
                        }).onConflictDoUpdate({
                            target: whatsappPreapplyLeads.userPhone,
                            set: {
                                updatedAt: new Date(),
                                answers: sql`jsonb_set(
                                jsonb_set(whatsapp_preapply_leads.answers, '{projectDescription}', ${JSON.stringify(fullDescription)}::jsonb),
                                '{source}', '"protocol_landing"'::jsonb
                            )`
                            }
                        });
                        console.log('✅ Lead synced to Marketing Engine (whatsappPreapplyLeads)');
                    } catch (marketingError) {
                        console.error('❌ Failed to sync lead to Marketing DB:', marketingError);
                    }

                } catch (waError) {
                    console.error('❌ Failed to trigger WhatsApp:', waError);
                }
            }

        } catch (nonFatalError) {
            console.error('⚠️ Non-fatal workflow error:', nonFatalError);
        }

        return NextResponse.json({ success: true, score, suggestedPackage });

    } catch (error) {
        console.error('❌ Error processing lead:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
