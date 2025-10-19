import {
  LeaderboardEntry,
  Leaderboard,
  UserGamificationProfile,
  TOKENIZATION_LEADERBOARDS,
  LeaderboardType,
  LeaderboardPeriod,
  RankTrend
} from '../types';

export class LeaderboardManager {
  private static instance: LeaderboardManager;

  public static getInstance(): LeaderboardManager {
    if (!LeaderboardManager.instance) {
      LeaderboardManager.instance = new LeaderboardManager();
    }
    return LeaderboardManager.instance;
  }

  /**
   * Get all leaderboards
   */
  getAllLeaderboards(): Leaderboard[] {
    return TOKENIZATION_LEADERBOARDS;
  }

  /**
   * Get leaderboard by ID
   */
  getLeaderboardById(leaderboardId: string): Leaderboard | null {
    return TOKENIZATION_LEADERBOARDS.find(lb => lb.id === leaderboardId) || null;
  }

  /**
   * Get leaderboard entries
   */
  async getLeaderboardEntries(
    leaderboardId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    const leaderboard = this.getLeaderboardById(leaderboardId);
    if (!leaderboard) {
      throw new Error(`Leaderboard ${leaderboardId} not found`);
    }

    console.log(`🏆 Fetching entries for leaderboard ${leaderboardId}, limit: ${limit}`);

    // Mock data - in real implementation, this would fetch from database
    const mockEntries: LeaderboardEntry[] = [
      {
        id: 'entry_1',
        userId: 'user_1',
        userName: 'CryptoKing',
        walletAddress: '0x1234...5678',
        totalPoints: 2500,
        currentLevel: 8,
        rank: 1,
        projectsApplied: 15,
        projectsApproved: 3,
        totalInvested: 5000,
        achievementsUnlocked: 12,
        communityContributions: 25,
        referralsCount: 8,
        lastActivity: new Date(),
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'entry_2',
        userId: 'user_2',
        userName: 'TokenMaster',
        walletAddress: '0x9876...3210',
        totalPoints: 2100,
        currentLevel: 7,
        rank: 2,
        projectsApplied: 12,
        projectsApproved: 2,
        totalInvested: 3200,
        achievementsUnlocked: 9,
        communityContributions: 18,
        referralsCount: 5,
        lastActivity: new Date(),
        joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      }
    ];

    return mockEntries.slice(offset, offset + limit);
  }

  /**
   * Get user rank in leaderboard
   */
  async getUserRank(userId: string, leaderboardId: string): Promise<{
    rank: number;
    totalUsers: number;
    percentile: number;
    trend: RankTrend;
  }> {
    const entries = await this.getLeaderboardEntries(leaderboardId, 1000);
    const userEntry = entries.find(entry => entry.userId === userId);

    if (!userEntry) {
      return {
        rank: entries.length + 1,
        totalUsers: entries.length,
        percentile: 100,
        trend: RankTrend.NEW
      };
    }

    // Calculate trend (mock implementation)
    const previousRank = userEntry.rank; // In real implementation, get from historical data
    const trend = previousRank < userEntry.rank ? RankTrend.UP :
                 previousRank > userEntry.rank ? RankTrend.DOWN : RankTrend.SAME;

    return {
      rank: userEntry.rank,
      totalUsers: entries.length,
      percentile: Math.round((userEntry.rank / entries.length) * 100),
      trend
    };
  }

  /**
   * Update leaderboard rankings
   */
  async updateLeaderboardRankings(leaderboardId: string): Promise<void> {
    console.log(`🏆 Updating rankings for leaderboard ${leaderboardId}`);

    // In real implementation, this would:
    // 1. Fetch all user profiles
    // 2. Calculate scores based on leaderboard type
    // 3. Update rankings in database
    // 4. Cache results for performance
  }

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(leaderboardId: string): Promise<{
    totalParticipants: number;
    averageScore: number;
    topScore: number;
    lastUpdated: Date;
    updateFrequency: number;
  }> {
    const entries = await this.getLeaderboardEntries(leaderboardId, 1000);

    const totalScore = entries.reduce((sum, entry) => sum + entry.totalPoints, 0);
    const averageScore = entries.length > 0 ? totalScore / entries.length : 0;
    const topScore = entries.length > 0 ? Math.max(...entries.map(e => e.totalPoints)) : 0;

    return {
      totalParticipants: entries.length,
      averageScore: Math.round(averageScore),
      topScore,
      lastUpdated: new Date(),
      updateFrequency: 3600 // 1 hour in seconds
    };
  }

  /**
   * Get user position relative to others
   */
  async getUserPosition(userId: string): Promise<{
    globalRank: number;
    categoryRanks: Record<string, number>;
    strengths: string[];
    improvements: string[];
  }> {
    const globalRank = await this.getUserRank(userId, 'global_all_time');

    // Mock category ranks
    const categoryRanks = {
      'investors_monthly': 15,
      'community_weekly': 8,
      'projects_all_time': 22
    };

    // Mock analysis
    const strengths = ['Community Engagement', 'Project Applications'];
    const improvements = ['Investment Volume', 'Referral Network'];

    return {
      globalRank: globalRank.rank,
      categoryRanks,
      strengths,
      improvements
    };
  }

  /**
   * Get trending users
   */
  async getTrendingUsers(limit: number = 5): Promise<LeaderboardEntry[]> {
    // Mock trending users (users with biggest rank improvements)
    const trendingUsers: LeaderboardEntry[] = [
      {
        id: 'trending_1',
        userId: 'user_trending_1',
        userName: 'RisingStar',
        walletAddress: '0x1111...2222',
        totalPoints: 1800,
        currentLevel: 6,
        rank: 25,
        projectsApplied: 8,
        projectsApproved: 1,
        totalInvested: 1200,
        achievementsUnlocked: 7,
        communityContributions: 12,
        referralsCount: 3,
        lastActivity: new Date(),
        joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      }
    ];

    return trendingUsers.slice(0, limit);
  }

  /**
   * Get leaderboard by type
   */
  getLeaderboardsByType(type: LeaderboardType): Leaderboard[] {
    return TOKENIZATION_LEADERBOARDS.filter(lb => lb.type === type);
  }

  /**
   * Get leaderboard by period
   */
  getLeaderboardsByPeriod(period: LeaderboardPeriod): Leaderboard[] {
    return TOKENIZATION_LEADERBOARDS.filter(lb => lb.period === period);
  }

  /**
   * Create custom leaderboard
   */
  async createLeaderboard(leaderboard: Omit<Leaderboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Leaderboard> {
    const newLeaderboard: Leaderboard = {
      ...leaderboard,
      id: `custom_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log(`🏆 Created new leaderboard: ${newLeaderboard.name}`);
    return newLeaderboard;
  }

  /**
   * Get competitive insights for user
   */
  async getCompetitiveInsights(userId: string): Promise<{
    rankMovement: number;
    closestCompetitors: LeaderboardEntry[];
    milestones: {
      nextRank: number;
      pointsNeeded: number;
      usersToBeat: number;
    };
    strengths: string[];
    opportunities: string[];
  }> {
    const currentRank = await this.getUserRank(userId, 'global_all_time');
    const allEntries = await this.getLeaderboardEntries('global_all_time', 100);

    // Find closest competitors
    const userIndex = allEntries.findIndex(entry => entry.userId === userId);
    const closestCompetitors = allEntries.slice(Math.max(0, userIndex - 2), userIndex + 3);

    // Calculate milestones
    const nextRank = Math.max(1, currentRank.rank - 1);
    const nextRankEntry = allEntries.find(entry => entry.rank === nextRank);
    const pointsNeeded = nextRankEntry ? nextRankEntry.totalPoints - (allEntries[userIndex]?.totalPoints || 0) : 0;

    return {
      rankMovement: 0, // Would calculate from historical data
      closestCompetitors,
      milestones: {
        nextRank,
        pointsNeeded,
        usersToBeat: currentRank.rank - nextRank
      },
      strengths: ['Consistent Activity', 'Community Engagement'],
      opportunities: ['Increase Investment Volume', 'Expand Network']
    };
  }
}