import { GamificationEvent, EventType, EventCategory } from '../types/events';
import { EventSystem } from './event-system';
import { ActionExecutorRegistry } from './action-executor-registry';
import type {
    GamificationResult,
    GamificationSource,
    ExecutionContext,
} from '../types/bridge';

/**
 * PBOX economy versioning.
 * Bump this when the conversion formula changes.
 * Old pbox_balances rows keep their value; only new deltas use the new rate.
 */
export const PBOX_CONVERSION_VERSION = 1;

/** Points required to earn 1 PBOX (version 1 rate). */
const POINTS_PER_PBOX_V1 = 10;

/**
 * GamificationService — the single public entrypoint for all external callers.
 *
 * ✅ Telegram App uses this via /api/gamification/record
 * ✅ Dashboard can call this directly (server-side)
 * ✅ Internal jobs / crons use source: 'system'
 *
 * ❌ External code should NEVER call EventSystem, PointsManager, etc. directly.
 */
export class GamificationService {
    private static instance: GamificationService;

    public static getInstance(): GamificationService {
        if (!GamificationService.instance) {
            GamificationService.instance = new GamificationService();
        }
        return GamificationService.instance;
    }

    private eventSystem = EventSystem.getInstance();

    /**
     * Record a gamification event from any source.
     *
     * Source-based policy is enforced here — callers can't bypass it.
     */
    async record(input: {
        source: GamificationSource;
        walletAddress: string;
        eventType: string;
        metadata?: Record<string, any>;
    }): Promise<GamificationResult> {
        // ── 1. Policy gate ─────────────────────────────────────────────────────
        this.assertSourceAllowed(input.source, input.eventType);

        // ── 2. Build canonical event ───────────────────────────────────────────
        const event: GamificationEvent = {
            id: crypto.randomUUID(),
            userId: input.walletAddress.toLowerCase(),
            type: (input.eventType as EventType) || EventType.FEATURE_UNLOCK,
            category: EventCategory.SPECIAL,
            points: 0, // determined by triggers, not caller
            metadata: {
                ...input.metadata,
                source: input.source,
                recordedAt: new Date().toISOString(),
            },
            createdAt: new Date(),
        };

        // ── 3. Evaluate triggers (pure, no side-effects) ───────────────────────
        const plan = await this.eventSystem.evaluate(event);

        // ── 4. Execute plan with action-level idempotency ──────────────────────
        let pointsEarned = 0;
        let achievementsUnlocked: string[] = [];
        let rewardsGranted: string[] = [];

        if (plan && plan.triggered.length > 0) {
            const ctx = this.buildExecutionContext(event.userId, input.source);
            const result = await ActionExecutorRegistry.execute(plan, ctx);
            pointsEarned = result.pointsAwarded;
            achievementsUnlocked = result.achievementsUnlocked;
            rewardsGranted = result.rewardsGranted;
        }

        // ── 5. Resolve current balances ────────────────────────────────────────
        // NOTE: These are stubs until DB is wired — they return computed values
        const totalPoints = await this.getTotalPoints(event.userId);
        const pboxBalance = await this.getPboxBalance(event.userId);
        const level = this.calculateLevel(totalPoints);

        // PBOX delta using versioned conversion rate
        const pboxDelta = Math.floor(pointsEarned / POINTS_PER_PBOX_V1);
        // Note: pbox_balances.last_conversion_version should be updated to PBOX_CONVERSION_VERSION on each delta

        return {
            pointsEarned,
            achievementsUnlocked,
            rewardsGranted,
            pboxDelta,
            balances: {
                totalPoints,
                pboxBalance: pboxBalance + pboxDelta,
                level,
            },
        };
    }

    // ── Private helpers ─────────────────────────────────────────────────────────

    private assertSourceAllowed(source: GamificationSource, eventType: string): void {
        if (source === 'telegram' || source === 'telegram_s2s') {
            if (process.env.ALLOW_TELEGRAM_GAMIFICATION !== 'true') {
                throw new Error('[GamificationService] Telegram gamification is disabled (ALLOW_TELEGRAM_GAMIFICATION)');
            }
            // Telegram cannot trigger protocol admin events
            const blockedEvents = ['protocol_deployed', 'sale_certified', 'admin_action'];
            if (blockedEvents.includes(eventType)) {
                throw new Error(`[GamificationService] Event type '${eventType}' is not allowed from Telegram source`);
            }
        }
    }

    private buildExecutionContext(userId: string, source: GamificationSource): ExecutionContext {
        // NOTE: stubs delegate to console.log until DB service is wired
        return {
            userId,
            source, // carries provenance through retries & DLQ
            markActionExecuted: async (eventId, triggerId, actionType) => {
                // TODO: INSERT INTO gamification_action_executions
                console.log(`[ActionExecution] marked: ${eventId}/${triggerId}/${actionType}`);
            },
            hasActionExecuted: async (eventId, triggerId, actionType) => {
                // TODO: SELECT FROM gamification_action_executions
                return false;
            },
            awardPoints: async (uid, points, reason) => {
                console.log(`[GamificationService] +${points} pts to ${uid} (${reason})`);
                return points;
            },
            unlockAchievement: async (uid, achievementId) => {
                console.log(`[GamificationService] 🏆 unlocked ${achievementId} for ${uid}`);
                return true;
            },
            grantReward: async (uid, rewardId) => {
                console.log(`[GamificationService] 🎁 granted ${rewardId} to ${uid}`);
                return true;
            },
            getPboxBalance: async (uid) => this.getPboxBalance(uid),
            getTotalPoints: async (uid) => this.getTotalPoints(uid),
            getLevel: async (uid) => this.calculateLevel(await this.getTotalPoints(uid)),
        };
    }

    private async getTotalPoints(userId: string): Promise<number> {
        // TODO: SELECT total_earned FROM pbox_balances WHERE wallet_address = userId
        return 0;
    }

    private async getPboxBalance(userId: string): Promise<number> {
        // TODO: SELECT (total_earned - reserved - claimed) FROM pbox_balances
        return 0;
    }

    private calculateLevel(totalPoints: number): number {
        // Mirrors PointsManager.calculateLevel (single source could be extracted later)
        const base = 100;
        const mult = 1.5;
        let level = 1;
        let needed = base;
        let accumulated = 0;
        while (totalPoints >= accumulated + needed) {
            accumulated += needed;
            level++;
            needed = Math.floor(needed * mult);
        }
        return level;
    }
}
