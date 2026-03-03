import { db } from "@/db";
import { protocolConfigs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { IProtocolConfigAdapter, IProtocolConfig } from "@pandoras/agora-engine";

export class DrizzleProtocolConfigAdapter implements IProtocolConfigAdapter {

    /**
     * Retrieves the live configuration for a protocol.
     * If none exists in DB, it injects the institutional defaults 
     * (2% fee, 25% max ratio, not paused).
     */
    async getActiveConfig(protocolId: number): Promise<IProtocolConfig> {
        const record = await db.query.protocolConfigs.findFirst({
            where: eq(protocolConfigs.protocolId, protocolId)
        });

        if (record) {
            return {
                protocolId: record.protocolId,
                feeRate: parseFloat(record.feeRate),
                inventoryMaxRatio: parseFloat(record.inventoryMaxRatio),
                earlyExitPenalty: parseFloat(record.earlyExitPenalty),
                buybackAllocationRatio: parseFloat(record.buybackAllocationRatio),
                settlementPaused: record.settlementPaused,
                phase: record.marketPhase as 'funding' | 'ready' | 'defense',
                readySince: record.readySince || undefined,
                // Since versioning was an idea, we synthesize it with unix epoch of update
                // We can track the epoch via the updatedAt timestamp for auditability.
                versionEpoch: record.updatedAt.getTime()
            };
        }

        // Institutional Defaults: Phase 1 (Funding First)
        return {
            protocolId,
            feeRate: 0.02,
            inventoryMaxRatio: 0.25,
            earlyExitPenalty: 0.15,
            buybackAllocationRatio: 0.0, // Manual activation required for Phase 2 (Defense)
            settlementPaused: false,
            phase: 'funding',
            versionEpoch: Date.now()
        };
    }
}
