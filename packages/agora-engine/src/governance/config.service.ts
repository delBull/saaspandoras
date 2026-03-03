export interface IProtocolConfig {
    protocolId: number;
    feeRate: number;
    inventoryMaxRatio: number;
    earlyExitPenalty: number;
    buybackAllocationRatio: number; // % of treasury dedicated to buybacks
    settlementPaused: boolean;
    phase: 'funding' | 'ready' | 'defense';
    readySince?: Date;
    versionEpoch: number; // For auditing the active configuration epoch
}

export interface IProtocolConfigAdapter {
    /**
     * Reads the active Governance Parameters for the specific protocol.
     * Bypasses the internal queue logic and retrieves the live values.
     */
    getActiveConfig(protocolId: number): Promise<IProtocolConfig>;
}
