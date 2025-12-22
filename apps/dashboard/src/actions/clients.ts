"use server";

import { db } from "@/db";
import { clients, paymentLinks, transactions, sowTemplates } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email/client";

export async function getClients() {
    try {
        const results = await db.select().from(clients).orderBy(desc(clients.createdAt));
        return { success: true, data: results };
    } catch (e) {
        console.error("Error fetching clients:", e);
        return { success: false, error: "Failed to fetch clients" };
    }
}

export async function getClientLinks(clientId: string) {
    try {
        const results = await db.select().from(paymentLinks)
            .where(eq(paymentLinks.clientId, clientId))
            .orderBy(desc(paymentLinks.createdAt));

        // Manual join for transactions status - simplfied for now
        // We really want to know if it's "PAID".
        // Let's attach the latest transaction status if possible, or just return links.

        return { success: true, data: results };
    } catch (e) {
        console.error("Error fetching client links:", e);
        return { success: false, error: "Failed to fetch links" };
    }
}

export async function createClient(data: typeof clients.$inferInsert) {
    try {
        const [newClient] = await db.insert(clients).values(data).returning();
        return { success: true, data: newClient };
    } catch (e) {
        console.error("Error creating client:", e);
        return { success: false, error: "Failed to create client" };
    }
}

export async function createPaymentLink(data: typeof paymentLinks.$inferInsert) {
    try {
        const [link] = await db.insert(paymentLinks).values(data).returning();
        return { success: true, data: link };
    } catch (e) {
        console.error("Error creating payment link:", e);
        return { success: false, error: "Failed to create link" };
    }
}

export async function updatePaymentStatus(linkId: string, status: 'pending' | 'paid' | 'cancelled', method: 'stripe' | 'crypto' | 'wire' = 'wire') {
    try {
        // Fetch Link & Client details
        const link = await db.query.paymentLinks.findFirst({
            where: eq(paymentLinks.id, linkId),
            with: { client: true }
        });

        if (!link) return { success: false, error: "Link not found" };

        // Insert Transaction Record
        await db.insert(transactions).values({
            linkId: link.id,
            clientId: link.clientId,
            amount: link.amount,
            currency: link.currency || "USD",
            method: method,
            status: status === 'paid' ? 'completed' : 'pending',
            processedAt: new Date(),
            createdAt: new Date(),
        });

        // Trigger Business Logic if Paid
        if (status === 'paid') {
            await processPaymentSuccess(linkId);
        }

        return { success: true };
    } catch (e) {
        console.error("Error updating payment status:", e);
        return { success: false, error: "Failed to update status" };
    }
}

export async function processPaymentSuccess(linkId: string) {
    try {
        // Fetch Link & Client details
        // We re-fetch to ensure we have latest state or we could pass arguments. 
        // Re-fetching is safer for standalone usage.
        const link = await db.query.paymentLinks.findFirst({
            where: eq(paymentLinks.id, linkId),
            with: { client: true }
        });

        if (!link || !link.client) return { success: false, error: "Link or Client not found" };

        const client = link.client as any;
        let newStatus = client.status;
        const meta = (client.metadata as any) || {};

        // 1. Advance Protocol State based on Link Title (SOW)
        if (link.title.includes("SOW Tier 1")) {
            newStatus = 'closed_won';
            await advanceProtocolState(link.clientId, 'IN_PROGRESS_TIER_1');
        } else if (link.title.includes("SOW Tier 2")) {
            await advanceProtocolState(link.clientId, 'IN_PROGRESS_TIER_2');
        } else if (link.title.includes("SOW Tier 3")) {
            await advanceProtocolState(link.clientId, 'IN_PROGRESS_TIER_3');
        } else {
            // Standard payment
            newStatus = 'closed_won';
        }

        // 2. Update Client Status in DB
        if (newStatus !== client.status) {
            await db.update(clients)
                .set({ status: newStatus })
                .where(eq(clients.id, link.clientId));
        }

        // 3. Send Receipt
        await sendReceiptEmail(client.email, client.name || "Builder", link.title, link.amount);

        return { success: true };
    } catch (e) {
        console.error("Error processing payment success:", e);
        return { success: false, error: "Business logic failed" };
    }
}

export async function manualSendReceipt(linkId: string) {
    try {
        const link = await db.query.paymentLinks.findFirst({
            where: eq(paymentLinks.id, linkId),
            with: {
                client: true
            }
        });

        if (link && link.client) {
            const c = link.client as any;
            await sendReceiptEmail(c.email, c.name || "Builder", link.title, link.amount);
            return { success: true };
        }
        return { success: false, error: "Link or client not found" };
    } catch (e) {
        console.error("Error sending receipt:", e);
        return { success: false, error: "Failed to send receipt" };
    }
}


// ... (existing imports, but add SOW templates)
import type { SOWTier } from "@/lib/sow-templates";
import { SOW_TEMPLATES } from "@/lib/sow-templates";
import { format } from "date-fns";
import type { ProtocolState, ProtocolMetadata } from "@/types/protocol-state";

// ... (existing helper functions if any)

export async function sendProtocolSOW(clientId: string, tier: SOWTier, templateId?: string, overrideAmount?: string) {
    try {
        const client = await db.query.clients.findFirst({ where: eq(clients.id, clientId) });
        if (!client) return { success: false, error: "Client not found" };

        // Define Defaults
        const defaults = {
            TIER_1: { title: "SOW Tier 1 - Viability & Utility", amount: "500" },
            TIER_2: { title: "SOW Tier 2 - Architecture", amount: "2000" },
            TIER_3: { title: "SOW Tier 3 - Deployment", amount: "2000" },
        };
        const config = defaults[tier];
        const amount = overrideAmount || config.amount;

        // Create Payment Link
        const [link] = await db.insert(paymentLinks).values({
            clientId: client.id,
            title: config.title,
            amount: amount,
            currency: "USD",
            methods: ['stripe', 'crypto', 'wire'],
            description: `Payment for ${tier} Execution`,
            createdBy: "admin_automation" // TODO: Pass actual user if possible
        }).returning();

        if (!link) return { success: false, error: "Failed to generate link" };

        // Generate SOW Content
        const sowId = `SOW-${tier}-${link.id.slice(0, 6).toUpperCase()}`;
        const variables = {
            sowId,
            date: format(new Date(), 'yyyy-MM-dd'),
            clientName: client.name || "Client",
            projectName: (client.metadata as any)?.protocol?.project_name || "Protocol Project",
            amount: amount
        };

        let sowHtml = "";

        // Fetch Dynamic Template if ID provided
        if (templateId && templateId !== 'default') {
            const tmpl = await db.query.sowTemplates.findFirst({ where: eq(sowTemplates.id, templateId) });
            if (tmpl) {
                // Simple replacement for now. In real app, use a proper templating engine.
                // Assuming format: ${v.variableName} in DB text works only if using eval or simple replace.
                // We will use strict replace for safety.
                let content = tmpl.content;
                content = content.replace(/\$\{v.sowId\}/g, variables.sowId);
                content = content.replace(/\$\{v.date\}/g, variables.date);
                content = content.replace(/\$\{v.clientName\}/g, variables.clientName);
                content = content.replace(/\$\{v.projectName\}/g, variables.projectName);
                content = content.replace(/\$\{v.amount\}/g, variables.amount);
                sowHtml = content;
            }
        }

        // Fallback
        if (!sowHtml) {
            sowHtml = SOW_TEMPLATES[tier](variables);
        }

        // 1. Send Email with SOW
        await sendEmail({
            to: client.email,
            subject: `Action Required: Sign & Pay ${config.title}`,
            html: `
                <p>Hello ${client.name},</p>
                <p>Please review and pay the attached Statement of Work for <strong>${tier}</strong>.</p>
                <p><em>"Este Litepaper define el marco técnico bajo el cual operamos. Su lectura es clave antes de avanzar."</em> -> <a href="${process.env.NEXT_PUBLIC_APP_URL}/litepaper">Leer Litepaper</a></p>
                
                <div style="margin: 20px 0; border: 1px solid #ccc; padding: 20px;">
                    ${sowHtml}
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/pay/${link.id}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Pay & Accept SOW ($${amount} USD)
                    </a>
                </div>
             `
        });

        // 2. Update Client State (ACTIVE_TIER_X)
        const meta = (client.metadata as any) || {};
        const protocolMeta: ProtocolMetadata = {
            state: `ACTIVE_${tier}` as ProtocolState,
            approved_tiers: meta.protocol?.approved_tiers || [],
            sow_history: [
                ...(meta.protocol?.sow_history || []),
                {
                    tier,
                    sow_id: sowId,
                    sent_at: new Date().toISOString(),
                    link_id: link.id,
                    status: 'sent',
                    template_id: templateId || 'default'
                }
            ]
        };

        await db.update(clients).set({
            metadata: { ...meta, protocol: protocolMeta },
            status: 'negotiating' // Keep as negotiating until fully closed/paid?
        }).where(eq(clients.id, clientId));

        return { success: true, linkId: link.id };

        // ... SOW logic
    } catch (e) {
        console.error("Error sending SOW:", e);
        return { success: false, error: "Failed to send SOW" };
    }
}

export async function sendMSALink(clientId: string) {
    try {
        const client = await db.query.clients.findFirst({ where: eq(clients.id, clientId) });
        if (!client) return { success: false, error: "Client not found" };

        const link = `${process.env.NEXT_PUBLIC_APP_URL}/legal/msa/${clientId}`;

        await sendEmail({
            to: client.email,
            subject: "Action Required: Sign Master Services Agreement",
            html: `
                <p>Hello ${client.name},</p>
                <p>Before we proceed with the Statement of Work, please review and accept our Master Services Agreement (MSA).</p>
                <p>This is a one-time process for all future services.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${link}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Review & Accept MSA
                    </a>
                </div>
                
                <p>Or paste this link: ${link}</p>
            `
        });

        // Update status to indicate MSA sent?
        // Reuse metadata
        const meta = (client.metadata as any) || {};
        const protocolMeta: ProtocolMetadata = {
            ...(meta.protocol || {}),
            msa_status: 'sent', // Add this field
            msa_sent_at: new Date().toISOString()
        };
        await db.update(clients).set({ metadata: { ...meta, protocol: protocolMeta } }).where(eq(clients.id, clientId));

        return { success: true };
    } catch (e) {
        console.error("Error sending MSA:", e);
        return { success: false, error: "Failed to send MSA" };
    }
}

export async function acceptMSA(clientId: string, signature: string) {
    try {
        const client = await db.query.clients.findFirst({ where: eq(clients.id, clientId) });
        if (!client) return { success: false, error: "Client not found" };

        const meta = (client.metadata as any) || {};
        const protocolMeta = {
            ...(meta.protocol || {}),
            msa_status: 'accepted',
            msa_accepted_at: new Date().toISOString(),
            msa_signature: signature,
            msa_version: '1.0'
        };

        await db.update(clients).set({
            metadata: { ...meta, protocol: protocolMeta }
        }).where(eq(clients.id, clientId));

        // Notify Admin? Optional.

        return { success: true };
    } catch (e) {
        console.error("Error accepting MSA:", e);
        return { success: false, error: "Failed to accept MSA" };
    }
}

export async function advanceProtocolState(clientId: string, targetState: ProtocolState) {
    try {
        const client = await db.query.clients.findFirst({ where: eq(clients.id, clientId) });
        if (!client) return { success: false };

        const meta = (client.metadata as any) || {};

        let approved = meta.protocol?.approved_tiers || [];
        // If advancing to APPROVED_TIER_1, add to approved list
        if (targetState === 'APPROVED_TIER_1') approved = Array.from(new Set([...approved, 'TIER_1']));
        if (targetState === 'APPROVED_TIER_2') approved = Array.from(new Set([...approved, 'TIER_2']));
        if (targetState === 'DEPLOYED') approved = Array.from(new Set([...approved, 'TIER_3']));

        const protocolMeta: ProtocolMetadata = {
            ...(meta.protocol || {}),
            state: targetState,
            approved_tiers: approved
        };

        await db.update(clients).set({
            metadata: { ...meta, protocol: protocolMeta }
        }).where(eq(clients.id, clientId));

        return { success: true };
    } catch (e) {
        return { success: false, error: "Failed to update state" };
    }
}


async function sendReceiptEmail(email: string, name: string, product: string, amount: string) {
    const html = `
    <div style="font-family: sans-serif; bg-color: #000; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
           <h1 style="color: #000;">Pandora's Finance</h1>
        </div>
        
        <h2 style="color: #65a30d;">¡Pago Confirmado!</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Hemos recibido tu pago de <strong>$${amount} USD</strong> por <strong>${product}</strong>.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

        <h3>Tu Viaje Comienza Aquí</h3>
        <p>Bienvenido al ecosistema de Pandora's Finance. Estás a un paso de comenzar a construir tu propio protocolo.</p>

        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="margin-top: 0;">Próximos Pasos:</h4>
            <ol>
                <li>Un miembro de nuestro equipo te contactará para agendar el Onboarding (Kickoff call).</li>
                <li>Prepara los assets de tu marca (Logo, Colores).</li>
                <li>Únete a nuestro Discord privado (si aplica).</li>
            </ol>
        </div>

        <div style="background-color: #000; color: #fff; padding: 20px; border-radius: 5px; text-align: center;">
            <h3 style="color: #84cc16; margin-top: 0;">Education Hub</h3>
            <p>Mientras esperas, te recomendamos leer nuestra guía de iniciación y el Litepaper Técnico:</p>
            <a href="https://pandoras.finance/education" style="display: inline-block; background-color: #84cc16; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Ver Guías</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/litepaper" style="display: inline-block; border: 1px solid #fff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Leer Litepaper</a>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Este es un recibo automático. Si requieres factura fiscal, por favor solicítala respondiendo a este correo.
        </p>
    </div>
    `;

    await sendEmail({
        to: email,
        subject: `Recibo de Pago: ${product} - Pandora's Finance`,
        html: html
    });
}

