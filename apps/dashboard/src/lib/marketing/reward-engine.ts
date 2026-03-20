import { db } from '@/db';
import { marketingLeads, marketingLeadEvents, marketingRewardLogs, users } from '@/db/schema';
import { eq, and, notInArray, sql } from 'drizzle-orm';
import { GamificationService } from '@/lib/gamification/service';

/**
 * Reward Weights Configuration
 * Defines how much XP/Credits are awarded for each type of marketing event.
 */
const REWARD_WEIGHTS: Record<string, { xp: number; credits?: number }> = {
  'LEAD_CREATED': { xp: 10 },
  'WHITELIST_APPROVED': { xp: 100, credits: 50 },
  'REFERRAL_JOINED': { xp: 50 },
  'HIGH_INTENT_ACTION': { xp: 25 },
};

export class RewardEngine {
  /**
   * Synchronizes rewards for a user based on their linked marketing leads.
   * This is intended to run as a background task.
   */
  static async syncUserRewards(userId: string) {
    console.log(`[RewardEngine] 🔄 Starting sync for user ${userId}`);
    
    // 1. & 2. Find leads and user info in parallel
    const [linkedLeads, user] = await Promise.all([
      db.query.marketingLeads.findMany({
        where: eq(marketingLeads.userId, userId),
        with: {
          events: true,
        }
      }),
      db.query.users.findFirst({
        where: eq(users.id, userId),
      })
    ]);

    if (!user || !user.walletAddress) {
      console.warn(`[RewardEngine] ⚠️ User ${userId} has no wallet address. Skipping sync.`);
      return { status: 'user_not_found_or_no_wallet' };
    }

    if (linkedLeads.length === 0) {
      return { status: 'no_leads_found' };
    }

    let totalXpAwarded = 0;
    let eventsProcessed = 0;

    // 3. Process each event for each lead
    for (const lead of linkedLeads) {
      for (const event of (lead as any).events || []) {
        const weight = REWARD_WEIGHTS[event.type] || REWARD_WEIGHTS[event.type.toUpperCase()];
        
        if (!weight) continue;

        try {
          // 4. CHECK IDEMPOTENCY: Has this event already been rewarded for this user?
          const alreadyRewarded = await db.query.marketingRewardLogs.findFirst({
            where: and(
              eq(marketingRewardLogs.userId, userId),
              eq(marketingRewardLogs.eventId, event.id),
              eq(marketingRewardLogs.rewardType, 'XP')
            )
          });

          if (alreadyRewarded) {
            console.log(`[RewardEngine] ⏭️ Event ${event.id} already rewarded for user ${userId}. Skipping.`);
            continue;
          }

          // 5. AWARD REWARD via GamificationService
          await GamificationService.trackEvent(user.walletAddress, `MARKETING_${event.type}`, {
            leadId: lead.id,
            eventId: event.id,
            pointsOverride: weight.xp,
            projectId: lead.projectId,
          });

          // 6. RECORD LOG
          await db.insert(marketingRewardLogs).values({
            userId,
            leadId: lead.id,
            eventId: event.id,
            rewardType: 'XP',
            amount: weight.xp,
          });

          totalXpAwarded += weight.xp;
          eventsProcessed++;
          
          console.log(`[RewardEngine] ✅ Awarded ${weight.xp} XP to ${userId} for event ${event.type}`);
        } catch (error) {
          console.error(`[RewardEngine] ❌ Error processing event ${event.id}:`, error);
        }
      }
    }

    return {
      status: 'success',
      eventsProcessed,
      totalXpAwarded,
    };
  }
}
