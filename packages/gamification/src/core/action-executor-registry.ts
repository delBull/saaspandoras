import { PointsCategory } from '../types/user';
import { ActionType } from '../types/events';
import type {
    ExecutionPlan,
    ExecutionContext,
    PlannedAction,
    TriggerExecution,
} from '../types/bridge';

/**
 * ActionExecutorRegistry
 *
 * Executes an ExecutionPlan produced by EventSystem.evaluate().
 * Idempotency is enforced at the (eventId, triggerId, actionType) level —
 * not just at the event level — enabling safe partial replay and auditing.
 *
 * NOTE: This class does NOT know about Telegram or any external source.
 * It only knows how to execute a plan via a provided ExecutionContext.
 */
export class ActionExecutorRegistry {
    /**
     * Execute all actions from a plan, with action-level idempotency.
     * Skips actions already executed (from prev retries or replays).
     */
    static async execute(
        plan: ExecutionPlan,
        ctx: ExecutionContext
    ): Promise<{ pointsAwarded: number; achievementsUnlocked: string[]; rewardsGranted: string[] }> {
        let pointsAwarded = 0;
        const achievementsUnlocked: string[] = [];
        const rewardsGranted: string[] = [];

        for (const trigger of plan.triggered) {
            for (const action of trigger.actions) {
                // ── Action-level idempotency guard ───────────────────────────────
                const alreadyDone = await ctx.hasActionExecuted(
                    plan.eventId,
                    trigger.triggerId,
                    action.type
                );
                if (alreadyDone) continue;

                // ── Delay if specified ───────────────────────────────────────────
                if (action.delay && action.delay > 0) {
                    await new Promise(r => setTimeout(r, action.delay! * 1000));
                }

                // ── Execute action ───────────────────────────────────────────────
                switch (action.type) {
                    case ActionType.AWARD_POINTS: {
                        const pts = await ctx.awardPoints(
                            plan.userId,
                            Number(action.value),
                            `Trigger ${trigger.triggerId}`
                        );
                        pointsAwarded += pts;
                        break;
                    }

                    case ActionType.UNLOCK_ACHIEVEMENT: {
                        const unlocked = await ctx.unlockAchievement(plan.userId, String(action.value));
                        if (unlocked) achievementsUnlocked.push(String(action.value));
                        break;
                    }

                    case ActionType.GRANT_REWARD: {
                        const granted = await ctx.grantReward(plan.userId, String(action.value));
                        if (granted) rewardsGranted.push(String(action.value));
                        break;
                    }

                    case ActionType.UPDATE_LEVEL:
                    case ActionType.SEND_NOTIFICATION:
                    case ActionType.TRIGGER_WEBHOOK:
                        // These are handled by the caller (GamificationService), not here
                        break;
                }

                // ── Mark this specific action as executed ────────────────────────
                await ctx.markActionExecuted(plan.eventId, trigger.triggerId, action.type);
            }
        }

        return { pointsAwarded, achievementsUnlocked, rewardsGranted };
    }
}
