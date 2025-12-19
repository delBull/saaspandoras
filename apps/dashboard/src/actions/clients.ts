"use server";

import { db } from "@/db";
import { clients, paymentLinks, transactions } from "@/db/schema";
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

export async function updatePaymentStatus(linkId: string, status: 'pending' | 'paid' | 'cancelled') {
    try {
        // Fetch Link & Client details first to populate transaction
        const link = await db.query.paymentLinks.findFirst({
            where: eq(paymentLinks.id, linkId),
            with: {
                client: true
            }
        });

        if (!link) {
            return { success: false, error: "Link not found" };
        }

        // Insert Transaction Record
        // We use 'wire' as the method for manual admin confirmation usually.
        await db.insert(transactions).values({
            linkId: link.id,
            clientId: link.clientId,
            amount: link.amount,
            currency: link.currency || "USD",
            method: 'wire', // Defaulting to wire for manual confirmation
            status: status === 'paid' ? 'completed' : 'pending',
            processedAt: new Date(),
            createdAt: new Date(),
        });

        // Update Client Status to 'closed_won' if not already
        if (status === 'paid' && link.client) {
            await db.update(clients)
                .set({ status: 'closed_won' })
                .where(eq(clients.id, link.clientId));

            // Send Receipt
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const c = link.client as any;
            await sendReceiptEmail(c.email, c.name || "Builder", link.title, link.amount);
        }

        return { success: true };
    } catch (e) {
        console.error("Error updating payment status:", e);
        return { success: false, error: "Failed to update status" };
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            <p>Mientras esperas, te recomendamos leer nuestra guía de iniciación:</p>
            <a href="https://pandoras.finance/education" style="display: inline-block; background-color: #84cc16; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Guías</a>
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
