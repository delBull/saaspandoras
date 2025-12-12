import type {
  UserGamificationProfile,
  UserAchievement,
  Reward,
  LeaderboardEntry,
  UserPoints,
  GamificationEvent,
  EventType,
  PointsCategory
} from '../types';

// In-Memory Database Service for Backend Logic
// This allows the GamificationEngine to function independently of the API layer.
export class DatabaseService {
  private profiles = new Map<string, UserGamificationProfile>();
  private achievements = new Map<string, UserAchievement[]>();
  private rewards = new Map<string, Reward[]>();
  private events = new Map<string, GamificationEvent[]>();
  private pointsHistory = new Map<string, UserPoints[]>();

  constructor() {
    console.log("💾 DatabaseService (In-Memory) Initialized");
  }

  // --- Profile ---

  async getUserProfile(userId: string): Promise<UserGamificationProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async createUserProfile(profile: UserGamificationProfile): Promise<UserGamificationProfile> {
    this.profiles.set(profile.userId, profile);
    // Initialize other collections
    if (!this.achievements.has(profile.userId)) this.achievements.set(profile.userId, []);
    if (!this.events.has(profile.userId)) this.events.set(profile.userId, []);
    if (!this.pointsHistory.has(profile.userId)) this.pointsHistory.set(profile.userId, []);
    return profile;
  }

  async updateUserProfile(userId: string, updates: Partial<UserGamificationProfile>): Promise<UserGamificationProfile> {
    const profile = this.profiles.get(userId);
    if (!profile) throw new Error("User not found");

    const updated = { ...profile, ...updates, updatedAt: new Date() };
    this.profiles.set(userId, updated);
    return updated;
  }

  // --- Points ---

  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    category: PointsCategory,
    metadata?: Record<string, unknown>
  ): Promise<UserPoints> {
    const entry: UserPoints = {
      id: Math.random().toString(36).substring(7),
      userId,
      points,
      reason,
      category,
      createdAt: new Date(),
      metadata
    };

    const history = this.pointsHistory.get(userId) || [];
    history.push(entry);
    this.pointsHistory.set(userId, history);

    // Update total points
    const profile = await this.getUserProfile(userId);
    if (profile) {
      await this.updateUserProfile(userId, {
        totalPoints: (profile.totalPoints || 0) + points
      });
    }

    return entry;
  }

  // --- Achievements ---

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.achievements.get(userId) || [];
  }

  async unlockAchievement(userId: string, achievement: UserAchievement): Promise<void> {
    const list = this.achievements.get(userId) || [];
    // Check if exists
    const idx = list.findIndex(a => a.achievementId === achievement.achievementId);
    if (idx >= 0) {
      list[idx] = achievement;
    } else {
      list.push(achievement);
    }
    this.achievements.set(userId, list);
  }

  // --- Events ---

  async trackEvent(userId: string, eventType: EventType, metadata?: Record<string, unknown>): Promise<GamificationEvent> {
    const event: GamificationEvent = {
      id: Math.random().toString(36).substring(7),
      userId,
      type: eventType,
      category: 'general' as any, // Default
      points: 0,
      createdAt: new Date(),
      metadata
    };

    const list = this.events.get(userId) || [];
    list.push(event);
    this.events.set(userId, list);
    return event;
  }

  // --- Rewards ---

  async getAvailableRewards(userId: string): Promise<Reward[]> {
    return this.rewards.get(userId) || [];
  }

  // --- Leaderboard ---

  async getLeaderboard(type: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    // Sort profiles by points
    const sorted: LeaderboardEntry[] = Array.from(this.profiles.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((p, i) => ({
        id: p.id,
        userId: p.userId,
        walletAddress: p.walletAddress,
        userName: p.walletAddress.substring(0, 6) + '...', // Fallback
        totalPoints: p.totalPoints,
        currentLevel: p.currentLevel,
        rank: i + 1,
        // Stats
        projectsApplied: p.projectsApplied,
        projectsApproved: p.projectsApproved,
        totalInvested: p.totalInvested,
        achievementsUnlocked: (this.achievements.get(p.userId) || []).filter(a => a.isCompleted).length,
        communityContributions: p.communityContributions,
        referralsCount: p.referralsCount,
        lastActivity: p.lastActivityDate,
        joinedAt: p.createdAt
      }));
    return sorted;
  }

  async claimReward(userId: string, rewardId: string): Promise<any> {
    return { success: true };
  }
}
