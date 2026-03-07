import { db } from "@/db";
import { protocolConfigQueues, protocolConfigs, actionLogs } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import type { IGovernanceStorageAdapter, PendingConfigUpdate } from "@pandoras/agora-engine";
import crypto from "crypto";

export class DrizzleGovernanceStorageAdapter implements IGovernanceStorageAdapter {

    async getPendingExecutableConfigs(): Promise<PendingConfigUpdate[]> {
        const now = new Date();

        // Select items where effectiveAt <= NOW and status == "PENDING"
        const pending = await db.query.protocolConfigQueues.findMany({
            where: and(
                eq(protocolConfigQueues.status, "PENDING"),
                lte(protocolConfigQueues.effectiveAt, now)
            )
        });

        return pending.map(p => ({
            queueId: p.id,
            protocolId: p.protocolId,
            proposedFeeRate: p.proposedFeeRate,
            proposedInventoryMaxRatio: p.proposedInventoryMaxRatio,
            proposedEarlyExitPenalty: p.proposedEarlyExitPenalty,
            proposedBuybackAllocationRatio: p.proposedBuybackAllocationRatio,
            proposedSettlementPaused: p.proposedSettlementPaused
        }));
    }

    async executeConfigUpdate(update: PendingConfigUpdate): Promise<void> {
        await db.transaction(async (tx) => {
            // 1. Fetch current config to build the update dynamically
            const currentConfig = await tx.query.protocolConfigs.findFirst({
                where: eq(protocolConfigs.protocolId, update.protocolId)
            });

            const oldValues = currentConfig || {
                feeRate: "0.02",
                inventoryMaxRatio: "0.25",
                earlyExitPenalty: "0.15",
                buybackAllocationRatio: "1.00",
                settlementPaused: false
            };

            const newFeeRate = update.proposedFeeRate !== null ? String(update.proposedFeeRate) : oldValues.feeRate;
            const newMaxRatio = update.proposedInventoryMaxRatio !== null ? String(update.proposedInventoryMaxRatio) : oldValues.inventoryMaxRatio;
            const newPaused = update.proposedSettlementPaused !== null ? update.proposedSettlementPaused : oldValues.settlementPaused;
            const newPenalty = update.proposedEarlyExitPenalty !== null ? String(update.proposedEarlyExitPenalty) : oldValues.earlyExitPenalty;
            const newAllocation = update.proposedBuybackAllocationRatio !== null ? String(update.proposedBuybackAllocationRatio) : oldValues.buybackAllocationRatio;

            // 2. Upsert the master config table
            await tx.insert(protocolConfigs)
                .values({
                    protocolId: update.protocolId,
                    feeRate: newFeeRate,
                    inventoryMaxRatio: newMaxRatio,
                    earlyExitPenalty: newPenalty,
                    buybackAllocationRatio: newAllocation,
                    settlementPaused: newPaused,
                    updatedAt: new Date(),
                    updatedBy: 'SYSTEM_GOVERNANCE_CRON'
                })
                .onConflictDoUpdate({
                    target: protocolConfigs.protocolId,
                    set: {
                        feeRate: newFeeRate,
                        inventoryMaxRatio: newMaxRatio,
                        earlyExitPenalty: newPenalty,
                        buybackAllocationRatio: newAllocation,
                        settlementPaused: newPaused,
                        updatedAt: new Date(),
                        updatedBy: 'SYSTEM_GOVERNANCE_CRON'
                    }
                });

            // 3. Mark the queue item as executed
            await tx.update(protocolConfigQueues)
                .set({ status: "EXECUTED" })
                .where(eq(protocolConfigQueues.id, update.queueId));

            // 4. Record Institutional Action Log
            await tx.insert(actionLogs).values({
                id: crypto.randomUUID(),
                correlationId: update.queueId,
                actionType: 'PROTOCOL_CONFIG_EXECUTED',
                protocolId: update.protocolId,
                metadata: {
                    queueId: update.queueId,
                    oldValues: {
                        feeRate: oldValues.feeRate,
                        inventoryMaxRatio: oldValues.inventoryMaxRatio,
                        earlyExitPenalty: oldValues.earlyExitPenalty,
                        buybackAllocationRatio: oldValues.buybackAllocationRatio,
                        settlementPaused: oldValues.settlementPaused
                    },
                    newValues: {
                        feeRate: newFeeRate,
                        inventoryMaxRatio: newMaxRatio,
                        earlyExitPenalty: newPenalty,
                        buybackAllocationRatio: newAllocation,
                        settlementPaused: newPaused
                    }
                }
            });
        });
    }
}
