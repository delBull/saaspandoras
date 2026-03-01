// ── Gamification Bridge Types ─────────────────────────────────────────────────
// Shared contract between GamificationService, webhooks, and API consumers
// (Telegram App, Dashboard, future edges)

export type GamificationSource = 'telegram' | 'telegram_s2s' | 'dashboard' | 'system';

/**
 * The canonical return type for any gamification record operation.
 * Every consumer (Telegram, Dashboard, webhooks) receives this shape.
 */
export interface GamificationResult {
    pointsEarned: number;
    achievementsUnlocked: string[];
    rewardsGranted: string[];
    pboxDelta: number;
    balances: {
        totalPoints: number;
        pboxBalance: number;
        level: number;
    };
}

// ── Execution Plan types (used by EventSystem + ActionExecutorRegistry) ────────

export interface ExecutionPlan {
    eventId: string;
    userId: string;
    source: GamificationSource; // provenance travels with the plan
    triggered: TriggerExecution[];
}

export interface TriggerExecution {
    triggerId: string;
    actions: PlannedAction[];
}

export interface PlannedAction {
    type: import('./events').ActionType;
    value: any;
    delay?: number; // seconds
}

export interface ExecutionContext {
    userId: string;
    source: GamificationSource;  // added for DLQ replay + audit
    markActionExecuted: (eventId: string, triggerId: string, actionType: string) => Promise<void>;
    hasActionExecuted: (eventId: string, triggerId: string, actionType: string) => Promise<boolean>;
    awardPoints: (userId: string, points: number, reason: string) => Promise<number>;
    unlockAchievement: (userId: string, achievementId: string) => Promise<boolean>;
    grantReward: (userId: string, rewardId: string) => Promise<boolean>;
    getPboxBalance: (userId: string) => Promise<number>;
    getTotalPoints: (userId: string) => Promise<number>;
    getLevel: (userId: string) => Promise<number>;
}

// ── Telegram Bot Capabilities (returned by /api/telegram/protocol/:slug) ──────

export interface ProtocolTelegramCapabilities {
    canMintFreeArtifact: boolean;
    canClaimPBOX: boolean;
    supportsGamification: boolean;
}

// ── PBOX Claim types ─────────────────────────────────────────────────────────

export interface PBOXClaimRequest {
    walletAddress: string;
    telegramUserId: string;
}

export interface PBOXClaimPayload {
    claimId: string;
    walletAddress: string;
    amount: number;          // PBOX tokens (integer)
    nonce: string;
    chainId: number;         // prevents cross-chain replay
    signature: string;       // HMAC-signed: wallet+amount+nonce+chainId+expiresAt
    expiresAt: number;       // unix ms
}
