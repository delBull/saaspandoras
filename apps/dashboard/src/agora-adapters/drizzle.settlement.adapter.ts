import { db } from "@/db";
import { agoraListings, artifacts, userBalances, actionLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { ISettlementStorageAdapter } from "@pandoras/agora-engine";
import crypto from "crypto";

import { withDeadlockRetry } from "@/db/db.utils";

export class DrizzleSettlementStorageAdapter implements ISettlementStorageAdapter {

    async executeAtomicSettlement<T>(callback: (tx: any) => Promise<T>): Promise<T> {
        return await withDeadlockRetry(async () => {
            return await db.transaction(async (tx) => {
                return await callback(tx);
            });
        });
    }

    async lockListingForUpdate(tx: any, listingId: string): Promise<{
        protocolId: number;
        artifactId: string;
        sellerId: string;
        price: string;
        status: string;
        lockedAt: Date | null;
    } | null> {
        // 1. SELECT ... FOR UPDATE implementation ensuring Row-Level Locking
        const [row] = await tx.select()
            .from(agoraListings)
            .where(eq(agoraListings.id, listingId))
            .for("update");

        if (!row) return null;

        // 2. We instantly mark it as locked optimistic to protect against outside non-tx reads
        if (row.status === "ACTIVE" && !row.lockedAt) {
            await tx.update(agoraListings)
                .set({ lockedAt: new Date() })
                .where(eq(agoraListings.id, listingId));
        }

        return {
            protocolId: row.protocolId,
            artifactId: row.artifactId,
            sellerId: row.sellerTelegramId,
            price: row.price,
            status: row.status,
            lockedAt: row.lockedAt
        };
    }

    async verifyOwnership(tx: any, artifactId: string, sellerId: string): Promise<boolean> {
        const [row] = await tx.select({ ownerId: artifacts.ownerId })
            .from(artifacts)
            .where(eq(artifacts.id, artifactId))
            .for("update");

        return row?.ownerId === sellerId;
    }

    async getUserBalance(tx: any, userId: string): Promise<string> {
        const [row] = await tx.select({ usdcBalance: userBalances.usdcBalance })
            .from(userBalances)
            .where(eq(userBalances.walletAddress, userId));

        return row?.usdcBalance || "0";
    }

    async transferFunds(tx: any, buyerId: string, sellerId: string, amountToBuyer: string, amountToSeller: string, platformFee: string): Promise<void> {
        // 1. Debit Buyer
        await tx.update(userBalances)
            .set({ usdcBalance: sql`${userBalances.usdcBalance} - ${amountToBuyer}::numeric` })
            .where(eq(userBalances.walletAddress, buyerId));

        // 2. Credit Seller
        // Upsert pattern in case seller doesn't have a wallet row yet
        await tx.insert(userBalances).values({
            walletAddress: sellerId,
            usdcBalance: amountToSeller
        }).onConflictDoUpdate({
            target: userBalances.walletAddress,
            set: { usdcBalance: sql`${userBalances.usdcBalance} + ${amountToSeller}::numeric` }
        });

        // 3. Credit Pandoraas Corporate Pool (Governance Revenue)
        await tx.insert(userBalances).values({
            walletAddress: 'PANDORAS_INTERNAL',
            usdcBalance: platformFee
        }).onConflictDoUpdate({
            target: userBalances.walletAddress,
            set: { usdcBalance: sql`${userBalances.usdcBalance} + ${platformFee}::numeric` }
        });
    }

    async transferOwnership(tx: any, artifactId: string, newOwnerId: string): Promise<void> {
        await tx.update(artifacts)
            .set({ ownerId: newOwnerId })
            .where(eq(artifacts.id, artifactId));
    }

    async markListingSold(tx: any, listingId: string): Promise<void> {
        await tx.update(agoraListings)
            .set({ status: "SOLD" })
            .where(eq(agoraListings.id, listingId));
    }

    async logAction(tx: any, correlationId: string, actionType: string, protocolId: number, metadata: Record<string, any>): Promise<void> {
        await tx.insert(actionLogs).values({
            id: crypto.randomUUID(),
            correlationId,
            actionType,
            protocolId,
            artifactId: metadata.artifactId,
            userId: metadata.buyerId,
            metadata
        });
    }
}
