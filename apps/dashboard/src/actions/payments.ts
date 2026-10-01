'use server';

import { db } from "@/db";
import { paymentLinks, clients, transactions, purchases, privatePaymentLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processPaymentSuccess } from "./clients";
import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { headers } from "next/headers";

export async function createPaymentLink(data: {
    title: string;
    amount: number;
    currency: string;
    description?: string;
    destinationWallet?: string;
}) {
    try {
        const auth = await getNexusAuthContext();
        if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
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
            methods: ['crypto', 'wire'], // Default enabled
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
        const auth = await getNexusAuthContext();
        if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
            throw new Error("Unauthorized");
        }

        // 1. Fetch Links, Transactions and Purchases (Purchases contains SPEI & Thirdweb Intents)
        const links = await db.select().from(paymentLinks);
        const hermesLinks = await db.query.privatePaymentLinks.findMany({
            orderBy: (t, { desc }) => [desc(t.createdAt)]
        });
        const allTransactions = await db.select().from(transactions);
        const allPurchases = await db.select().from(purchases);
        const pendingPurchases = allPurchases.filter(p => p.status === 'pending');
        const completedPurchases = allPurchases.filter(p => p.status === 'completed');

        // 2. Calculate Stats
        const totalLinks = links.length + hermesLinks.length;
        const activeLinks = links.filter(l => l.isActive).length + hermesLinks.filter(l => l.status === 'active' || l.status === 'pending').length;

        // Real Revenue: Sum of all transactions with status 'completed'
        const completedTx = allTransactions.filter(t => t.status === 'completed');
        const completedHermes = hermesLinks.filter(l => l.status === 'completed');
        
        const totalRevenue = 
            completedTx.reduce((acc, curr) => acc + Number(curr.amount), 0) + 
            completedHermes.reduce((acc, curr) => acc + Number(curr.amount), 0) +
            completedPurchases.reduce((acc, curr) => acc + Number(curr.amount), 0);

        // "Pending Payment": Sum of transactions & purchases with status 'pending'
        const pendingTx = allTransactions.filter(t => t.status === 'pending');
        const pendingHermes = hermesLinks.filter(l => l.status === 'pending');
        const pendingTxTotal = pendingTx.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const pendingPurchasesTotal = pendingPurchases.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const pendingHermesTotal = pendingHermes.reduce((acc, curr) => acc + Number(curr.amount), 0);
        
        const pendingPayment = pendingTxTotal + pendingPurchasesTotal + pendingHermesTotal;

        const activeClientsSet = new Set([
            ...completedTx.map(t => t.clientId).filter(Boolean),
            ...completedHermes.map(l => l.destinationWallet),
            ...completedPurchases.map(p => p.userId).filter(Boolean)
        ]);
        const activeClients = activeClientsSet.size;

        // 3. Recent Links (descending)
        const unifiedLinks = [
            ...links.map(l => ({ ...l, type: 'public' })),
            ...hermesLinks.map(l => ({ ...l, type: 'hermes', isActive: l.status === 'active' || l.status === 'pending' }))
        ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        const recentLinks = unifiedLinks.slice(0, 10);

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
            linkTitle: `Reserva ${['SPEI_FASTLANE', 'bank_transfer', 'fastlane'].includes(p.paymentMethod) ? 'SPEI' : 'Thirdweb'} (${p.purchaseId})`
          })),
          ...pendingHermes.map(l => ({
            id: l.id,
            amount: l.amount,
            currency: l.currency || 'USD',
            status: l.status,
            type: 'Hermes / Nexus',
            processedAt: l.createdAt,
            clientId: l.destinationWallet,
            linkTitle: `Intent: ${l.title}`
          }))
        ].sort((a, b) => new Date(b.processedAt || 0).getTime() - new Date(a.processedAt || 0).getTime());


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
        const auth = await getNexusAuthContext();
        if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
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
        const auth = await getNexusAuthContext();
        if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
            throw new Error("Unauthorized");
        }

        // Check if it's a Hermes / Nexus Intent (privatePaymentLinks)
        const hermesLink = await db.query.privatePaymentLinks.findFirst({
            where: eq(privatePaymentLinks.id, transactionId)
        });

        if (hermesLink && hermesLink.status !== 'completed') {
            const nextStatus = status === 'completed' ? 'completed' : 'cancelled';
            await db.update(privatePaymentLinks)
                .set({ status: nextStatus })
                .where(eq(privatePaymentLinks.id, transactionId));

            // Payment Core wiring (admin approval == executive approval):
            // dispatch the settlement so the Orchestrator activates the
            // tenant's product and the Audit Ledger + Event Spine stay in
            // sync with every other payment path (executive tools, webhook).
            if (nextStatus === 'completed') {
                try {
                    const meta = (hermesLink.metadata as Record<string, any>) || {};
                    const { paymentOrchestrator } = await import('@/lib/pandoras/core/domains/hermes/payments/core/orchestrator');
                    const event: any = {
                        eventId: `admin_settle_${hermesLink.id}_${Date.now()}`,
                        vertical: meta.vertical || 'GROWTH_OS',
                        organizationId: meta.tenantId || 'pandoras',
                        intentId: hermesLink.id,
                        productId: meta.productId || 'GENERAL',
                        amount: Number(hermesLink.amount),
                        currency: String(hermesLink.currency || 'USD').toUpperCase(),
                        provider: 'ADMIN_PANEL',
                        providerTransactionId: `admin_${hermesLink.id}`,
                        metadata: { viaAdminPanel: true, originalMetadata: meta },
                        timestamp: new Date(),
                    };
                    await paymentOrchestrator.processSettlement(event);
                } catch (orchErr: any) {
                    // Approval stands (state already completed); dispatch failure
                    // must be visible for the next reconciliation pass — never
                    // silent, never blocking the admin's action.
                    console.error('[PaymentsAPI] Orchestrator dispatch failed after admin approval:', orchErr?.message);
                }
            }
            return { success: true };
        }

        // Check if it's a purchase record (SPEI Fastlane / Thirdweb Intent)
        const existingPurchase = await db.query.purchases.findFirst({
            where: eq(purchases.id, transactionId)
        });

        if (existingPurchase && existingPurchase.status !== 'completed') {
            await db.update(purchases)
                .set({ status })
                .where(eq(purchases.id, transactionId));
            // RWA settlement policy: legacy approve route inserts daoMembers +
            // ambassador commissions. This panel approval only flips state —
            // DAO/NFT/IPFS projections stay downstream consumers of the
            // 'rwa.purchase.settled' outbox event (Phase 2 contract).
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
