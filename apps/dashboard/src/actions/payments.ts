'use server';

import { db } from "@/db";
import { paymentLinks, clients, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processPaymentSuccess } from "./clients";

export async function createPaymentLink(data: {
    title: string;
    amount: number;
    currency: string;
    description?: string;
    destinationWallet?: string;
}) {
    try {
        const { title, amount, currency, description, destinationWallet } = data;

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
            destinationWallet: destinationWallet || null,
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

        // "Pending Payment": Sum of transactions with status 'pending'
        const pendingTx = allTransactions.filter(t => t.status === 'pending');
        const pendingPayment = pendingTx.reduce((acc, curr) => acc + Number(curr.amount), 0);

        // 3. Recent Links (descending)
        const recentLinks = [...links].reverse().slice(0, 10);

        // 4. Pending Transactions (for Admin Verification)
        const pendingTransactions = pendingTx.map(t => ({
            ...t,
            // Attach link title manually if needed or join
            linkTitle: links.find(l => l.id === t.linkId)?.title || "Desconocido"
        }));

        return {
            success: true,
            stats: {
                totalRevenue,
                activeLinks,
                totalLinks,
                pendingPayment
            },
            links: recentLinks,
            pendingTransactions
        };
    } catch (error) {
        console.error("Error fetching payment stats:", error);
        return { success: false, error: "Failed to fetch stats" };
    }
}

export async function deletePaymentLink(id: string) {
    try {
        // Cascade delete transactions first (manual cleanup if no FK cascade)
        await db.delete(transactions).where(eq(transactions.linkId, id));
        await db.delete(paymentLinks).where(eq(paymentLinks.id, id));
        return { success: true };
    } catch (error) {
        console.error("Error deleting link:", error);
        return { success: false, error: "Failed to delete link" };
    }
}

export async function updateTransactionStatus(transactionId: string, status: 'completed' | 'rejected') {
    try {
        const [tx] = await db.update(transactions)
            .set({
                status,
                processedAt: new Date()
            })
            .where(eq(transactions.id, transactionId))
            .returning();

        if (status === 'completed' && tx?.linkId) {
            await processPaymentSuccess(tx.linkId);
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating transaction:", error);
        return { success: false, error: "Update failed" };
    }
}
