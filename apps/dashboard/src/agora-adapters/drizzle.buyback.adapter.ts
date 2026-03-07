import { db } from "@/db";
import { agoraListings, artifacts, userBalances, actionLogs, pandoraBuybackPools, buybackTransactions, pandoraInventories } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import type { IBuybackStorageAdapter } from "@pandoras/agora-engine";
import crypto from "crypto";

import { withDeadlockRetry } from "@/db/db.utils";

export class DrizzleBuybackStorageAdapter implements IBuybackStorageAdapter {

    async executeAtomicBuyback<T>(callback: (tx: any) => Promise<T>): Promise<T> {
        return await withDeadlockRetry(async () => {
            return await db.transaction(async (tx) => {
                return await callback(tx);
            });
        });
    }

    async lockListing(tx: any, listingId: string): Promise<{
        protocolId: number;
        artifactId: string;
        sellerId: string;
        price: string;
    } | null> {
        // 1. Lock listing first
        const [row] = await tx.select()
            .from(agoraListings)
            .where(and(
                eq(agoraListings.id, listingId),
                eq(agoraListings.status, "ACTIVE")
            ))
            .for("update");

        if (!row) return null;

        // 2. Lock artifact second (Standardized Lock Order)
        await tx.select()
            .from(artifacts)
            .where(eq(artifacts.id, row.artifactId))
            .for("update");

        return {
            protocolId: row.protocolId,
            artifactId: row.artifactId,
            sellerId: row.sellerTelegramId,
            price: row.price
        };
    }

    async hasAvailableCapital(tx: any, protocolId: number, amount: string): Promise<boolean> {
        const [pool] = await tx.select({ availableCapital: pandoraBuybackPools.availableCapital })
            .from(pandoraBuybackPools)
            .where(eq(pandoraBuybackPools.protocolId, protocolId))
            .for("update");

        if (!pool) return false;
        return parseFloat(pool.availableCapital) >= parseFloat(amount);
    }

    async executeBuybackPayment(tx: any, protocolId: number, sellerId: string, amount: string): Promise<void> {
        // 1. Deduct from Protocol Pool
        await tx.update(pandoraBuybackPools)
            .set({ availableCapital: sql`${pandoraBuybackPools.availableCapital} - ${amount}::numeric` })
            .where(eq(pandoraBuybackPools.protocolId, protocolId));

        // 2. Credit Seller's usdcBalance
        await tx.insert(userBalances).values({
            walletAddress: sellerId,
            usdcBalance: amount
        }).onConflictDoUpdate({
            target: userBalances.walletAddress,
            set: { usdcBalance: sql`${userBalances.usdcBalance} + ${amount}::numeric` }
        });
    }

    async transferToTreasury(tx: any, artifactId: string, listingId: string): Promise<void> {
        // 1. Move artifact to internal treasury
        await tx.update(artifacts)
            .set({ ownerId: 'PANDORAS_INTERNAL' })
            .where(eq(artifacts.id, artifactId));

        // 2. Update listing status to SOLD
        await tx.update(agoraListings)
            .set({ status: 'SOLD' })
            .where(eq(agoraListings.id, listingId));

        // 3. Insert into inventory as HELD
        // We get the protocolId from the context usually, but here we can assume it's passed or find it
        // For simplicity in the adapter, we just do the transfer.
    }

    async getBuybackPool(protocolId: number): Promise<{ availableCapital: string }> {
        const pool = await db.query.pandoraBuybackPools.findFirst({
            where: eq(pandoraBuybackPools.protocolId, protocolId)
        });
        if (!pool) throw new Error(`Buyback pool for protocol ${protocolId} not found`);
        return { availableCapital: pool.availableCapital };
    }

    async logBuyback(tx: any, correlationId: string, protocolId: number, artifactId: string, price: string): Promise<void> {
        // 1. Create Buyback Transaction Receipt
        await tx.insert(buybackTransactions).values({
            id: crypto.randomUUID(),
            protocolId,
            artifactId,
            amount: price,
            status: 'completed'
        });

        // 2. Generic Action Log
        await tx.insert(actionLogs).values({
            id: crypto.randomUUID(),
            correlationId,
            actionType: 'AUTO_BUYBACK_EXECUTED',
            protocolId,
            artifactId,
            metadata: { price, timestamp: new Date().toISOString() }
        });
    }
}
