'use server';

import { db } from "@/db";
import { paymentLinks, clients, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createPaymentLink(data: {
    title: string;
    amount: number;
    currency: string;
    description?: string
}) {
    try {
        const { title, amount, currency, description } = data;

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
            methods: ['stripe', 'crypto', 'wire'], // Default enabled
            isActive: true,
        }).returning();

        return { success: true, link: newLink };
    } catch (error) {
        console.error("Error creating payment link:", error);
        return { success: false, error: "Failed to create payment link" };
    }
}

export async function getPaymentsDashboardStats() {
    try {
        // 1. Fetch Links and Transactions
        const links = await db.select().from(paymentLinks);
        // Using raw select for transactions to ensure we get everything
        const allTransactions = await db.select().from(transactions);

        // 2. Calculate Stats
        const totalLinks = links.length;
        const activeLinks = links.filter(l => l.isActive).length;

        // Real Revenue: Sum of all transactions with status 'completed'
        // We assume amounts are USD-normalized or simplistic sum for V1 if all generic
        const completedTx = allTransactions.filter(t => t.status === 'completed');
        const totalRevenue = completedTx.reduce((acc, curr) => acc + Number(curr.amount), 0);

        // Pending Payment: Sum of ACTIVE links' amounts minus Revenue?
        // Actually, a better metric for "Pending" might be:
        // Sum of all Active Links created recently that don't have a completed transaction?
        // This is tricky without strict 1-to-1 link tracking. 
        // Simplification: Sum of all Active Links that are NOT expired.
        // We will just sum all Active Links amounts. This represents "Potential Revenue in Pipeline".
        const potentialRevenue = links.filter(l => l.isActive).reduce((acc, curr) => acc + Number(curr.amount), 0);

        // "Pending" = Potential - Collected (roughly, assuming 1 link = 1 intended payment)
        // Ensure non-negative
        const pendingPayment = Math.max(0, potentialRevenue - totalRevenue);

        // 3. Recent Links (descending)
        const recentLinks = [...links].reverse().slice(0, 10);

        return {
            success: true,
            stats: {
                totalRevenue,
                activeLinks,
                totalLinks,
                pendingPayment
            },
            links: recentLinks
        };
    } catch (error) {
        console.error("Error fetching payment stats:", error);
        return { success: false, error: "Failed to fetch stats" };
    }
}
