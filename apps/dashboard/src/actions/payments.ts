'use server';

import { db } from "@/db";
import { paymentLinks, clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createPaymentLink(data: {
    title: string;
    amount: number;
    currency: string;
    description?: string
}) {
    try {
        const { title, amount, currency, description } = data;

        // 1. Create or Find a "Guest" Client for generic links? 
        // For now, we might need a default Client or allow link without client?
        // Schema says: clientId: text("client_id").references(() => clients.id).notNull()
        // We will fallback to a "Default" or "Direct Link" client placeholder if not provided, 
        // or effectively create a "General Public" client record for this purpose if it doesn't exist.

        // Strategy: Create a 'General Public' client if not exists
        let generalClient = await db.query.clients.findFirst({
            where: eq(clients.email, 'general@public.com')
        });

        if (!generalClient) {
            [generalClient] = await db.insert(clients).values({
                email: 'general@public.com',
                name: 'General Public (Direct Links)',
                status: 'lead'
            }).returning();
        }

        if (!generalClient) throw new Error("Failed to resolve client");

        const [newLink] = await db.insert(paymentLinks).values({
            clientId: generalClient.id,
            title,
            amount: amount.toString(), // Store as decimal string
            currency,
            description: description || '',
            methods: ['stripe', 'crypto'], // Default enabled
            isActive: true,
        }).returning();

        return { success: true, link: newLink };
    } catch (error) {
        console.error("Error creating payment link:", error);
        return { success: false, error: "Failed to create payment link" };
    }
}
