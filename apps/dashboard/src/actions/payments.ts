'use server';

import { db } from "@/db";
import { paymentLinks, clients, transactions, purchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processPaymentSuccess } from "./clients";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";

export async function createPaymentLink(data: {
    title: string;
    amount: number;
    currency: string;
    description?: string;
    destinationWallet?: string;
}) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
            throw new Error("Unauthorized");
        }

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
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
            throw new Error("Unauthorized");
        }

        // 1. Fetch Links, Transactions and Purchases (Purchases contains SPEI & Thirdweb Intents)
        const links = await db.select().from(paymentLinks);
        const allTransactions = await db.select().from(transactions);
        const pendingPurchases = await db.query.purchases.findMany({
          where: eq(purchases.status, 'pending')
        });

        // 2. Calculate Stats
        const totalLinks = links.length;
        const activeLinks = links.filter(l => l.isActive).length;

        // Real Revenue: Sum of all transactions with status 'completed'
        const completedTx = allTransactions.filter(t => t.status === 'completed');
        const totalRevenue = completedTx.reduce((acc, curr) => acc + Number(curr.amount), 0);

        // "Pending Payment": Sum of transactions & purchases with status 'pending'
        const pendingTx = allTransactions.filter(t => t.status === 'pending');
        const pendingTxTotal = pendingTx.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const pendingPurchasesTotal = pendingPurchases.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const pendingPayment = pendingTxTotal + pendingPurchasesTotal;

        const activeClientsSet = new Set(completedTx.map(t => t.clientId).filter(Boolean));
        const activeClients = activeClientsSet.size;

        // 3. Recent Links (descending)
        const recentLinks = [...links].reverse().slice(0, 10);

        // 4. Pending Transactions & Purchases (for Admin Verification / SPEI Approval)
        const combinedPending = [
          ...pendingTx.map(t => ({
            ...t,
            type: 'link',
            linkTitle: links.find(l => l.id === t.linkId)?.title || "Pago Directo"
          })),
          ...pendingPurchases.map(p => ({
            id: p.id,
            amount: p.amount,
            currency: p.currency || 'USD',
            status: p.status,
            type: p.paymentMethod || 'SPEI_FASTLANE',
            processedAt: p.createdAt,
            clientId: p.userId,
            linkTitle: `Reserva ${p.paymentMethod === 'SPEI_FASTLANE' ? 'SPEI' : 'Thirdweb'} (${p.purchaseId})`
          }))
        ];

        return {
            success: true,
            stats: {
                totalRevenue,
                activeLinks,
                totalLinks,
                pendingPayment,
                activeClients
            },
            links: recentLinks,
            pendingTransactions: combinedPending
        };
    } catch (error) {
        console.error("Error fetching payment stats:", error);
        return { success: false, error: "Failed to fetch stats" };
    }
}

export async function deletePaymentLink(id: string) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
            throw new Error("Unauthorized");
        }

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
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
            throw new Error("Unauthorized");
        }

        // Check if it's a purchase record (SPEI Fastlane / Thirdweb Intent)
        const existingPurchase = await db.query.purchases.findFirst({
            where: eq(purchases.id, transactionId)
        });

        if (existingPurchase) {
            await db.update(purchases)
                .set({ status })
                .where(eq(purchases.id, transactionId));
            return { success: true };
        }

        // Fallback to standard transactions table
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
