import { db } from "@/db";
import { agoraListings, artifacts, userBalances, actionLogs, pandoraBuybackPools, pandoraInventories } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import type { IEarlyExitStorageAdapter } from "@pandoras/agora-engine";
import crypto from "crypto";
import { executeNavSnapshots } from "../crons/nav.cron";

import { withDeadlockRetry } from "@/db/db.utils";

export class DrizzleEarlyExitStorageAdapter implements IEarlyExitStorageAdapter {

    async executeAtomicExit<T>(callback: (tx: any) => Promise<T>): Promise<T> {
        return await withDeadlockRetry(async () => {
            return await db.transaction(async (tx) => {
                return await callback(tx);
            });
        });
    }

    async verifyOwnership(tx: any, artifactId: string, sellerId: string): Promise<boolean> {
        // --- HARDENING: Lock Order Enforcement ---
        // 1. Lock any active listing for this artifact first
        await tx.select()
            .from(agoraListings)
            .where(and(
                eq(agoraListings.artifactId, artifactId),
                eq(agoraListings.status, "ACTIVE")
            ))
            .for("update");

        // 2. Lock the artifact row second
        const [row] = await tx.select({ ownerId: artifacts.ownerId })
            .from(artifacts)
            .where(eq(artifacts.id, artifactId))
            .for("update");

        return row?.ownerId === sellerId;
    }

    async hasAvailableCapital(tx: any, protocolId: number, requiredPayout: string): Promise<boolean> {
        // 1. Lock the Buyback pool row to prevent parallel exits or ROFRs from draining it
        const [pool] = await tx.select({ availableCapital: pandoraBuybackPools.availableCapital })
            .from(pandoraBuybackPools)
            .where(eq(pandoraBuybackPools.protocolId, protocolId))
            .for("update");

        if (!pool) return false;

        return parseFloat(pool.availableCapital) >= parseFloat(requiredPayout);
    }

    async processExitPayout(tx: any, protocolId: number, sellerId: string, payout: string): Promise<void> {
        // 1. Deduct from Pandora Buyback Pool
        await tx.update(pandoraBuybackPools)
            .set({ availableCapital: sql`${pandoraBuybackPools.availableCapital} - ${payout}::numeric` })
            .where(eq(pandoraBuybackPools.protocolId, protocolId));

        // 2. Credit Seller's usdcBalance via Upsert
        await tx.insert(userBalances).values({
            walletAddress: sellerId,
            usdcBalance: payout
        }).onConflictDoUpdate({
            target: userBalances.walletAddress,
            set: { usdcBalance: sql`${userBalances.usdcBalance} + ${payout}::numeric` }
        });
    }

    async confiscateArtifact(tx: any, protocolId: number, artifactId: string): Promise<void> {
        // 1. Transfer artifact ownership to Protocol Treasury Wallet definition
        await tx.update(artifacts)
            .set({ ownerId: 'PANDORAS_INTERNAL' }) // Institutional Treasury Account
            .where(eq(artifacts.id, artifactId));

        // 2. Insert into Protocol Inventory as HELD status
        await tx.insert(pandoraInventories).values({
            protocolId,
            artifactId,
            status: 'HELD',
            acquiredAt: new Date()
        });

        // 3. Mark any active listings for this artifact as CANCELLED (cleanup)
        await tx.update(agoraListings)
            .set({ status: 'CANCELLED', cancelledAt: new Date() })
            .where(eq(agoraListings.artifactId, artifactId));
    }

    async logExitTransaction(tx: any, correlationId: string, protocolId: number, artifactId: string, payout: string): Promise<void> {
        await tx.insert(actionLogs).values({
            id: crypto.randomUUID(),
            correlationId,
            actionType: 'EARLY_EXIT_EXECUTED',
            protocolId,
            artifactId,
            metadata: {
                payout,
                timestamp: new Date().toISOString()
            }
        });
    }

    triggerNAVSnapshot(protocolId: number, correlationId: string): Promise<void> {
        // Here we jump out of the Early Exit Adapter logic and orchestrate
        // the system-wide NAV generation cron job immediately rather than wait 10m.
        console.log(`[EARLY_EXIT] Forcing immediate NAV Snapshot stabilization for Protocol ${protocolId}`);

        // We run it async outside the DB transaction. We mock the cron execution.
        // In production, you might just trigger the exact calculateAndSnapshotNAV
        // But for structural mapping, this works.
        setTimeout(() => {
            executeNavSnapshots().catch(console.error);
        }, 100);

        return Promise.resolve();
    }
}
