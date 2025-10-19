import { EventType, PointsCategory } from '../types';
import { GamificationEngine } from '../core/gamification-engine';

/**
 * Integration utilities for tokenization platform activities
 */
export class TokenizationIntegration {
  private static instance: TokenizationIntegration;
  private engine: GamificationEngine;

  constructor() {
    this.engine = GamificationEngine.getInstance();
  }

  public static getInstance(): TokenizationIntegration {
    if (!TokenizationIntegration.instance) {
      TokenizationIntegration.instance = new TokenizationIntegration();
    }
    return TokenizationIntegration.instance;
  }

  /**
   * Track project application submission
   */
  async trackProjectApplication(userId: string, projectData: any): Promise<void> {
    await this.engine.trackEvent(userId, EventType.PROJECT_APPLICATION_SUBMITTED, {
      projectTitle: projectData.title,
      projectCategory: projectData.businessCategory,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track project approval
   */
  async trackProjectApproval(userId: string, projectId: string): Promise<void> {
    await this.engine.trackEvent(userId, EventType.PROJECT_APPLICATION_APPROVED, {
      projectId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track investment made
   */
  async trackInvestment(userId: string, projectId: string, amount: number): Promise<void> {
    await this.engine.trackEvent(userId, EventType.INVESTMENT_MADE, {
      projectId,
      amount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track daily login
   */
  async trackDailyLogin(userId: string): Promise<void> {
    await this.engine.trackEvent(userId, EventType.DAILY_LOGIN, {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track user registration
   */
  async trackUserRegistration(userId: string): Promise<void> {
    await this.engine.trackEvent(userId, EventType.USER_REGISTERED, {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track community contribution
   */
  async trackCommunityContribution(userId: string, contributionType: string, metadata?: any): Promise<void> {
    await this.engine.trackEvent(userId, EventType.COMMUNITY_POST, {
      contributionType,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track course completion
   */
  async trackCourseCompletion(userId: string, courseId: string, courseName: string): Promise<void> {
    await this.engine.trackEvent(userId, EventType.COURSE_COMPLETED, {
      courseId,
      courseName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track referral made
   */
  async trackReferral(userId: string, referredUserId: string): Promise<void> {
    await this.engine.trackEvent(userId, EventType.REFERRAL_MADE, {
      referredUserId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get points for specific activity
   */
  getPointsForActivity(activity: string): number {
    const pointsMap: Record<string, number> = {
      'project_application': 50,
      'project_approval': 100,
      'investment': 25,
      'daily_login': 10,
      'referral': 200,
      'course_completion': 100,
      'community_post': 15
    };

    return pointsMap[activity] || 0;
  }

  /**
   * Get activity category
   */
  getActivityCategory(activity: string): PointsCategory {
    const categoryMap: Record<string, PointsCategory> = {
      'project_application': PointsCategory.PROJECT_APPLICATION,
      'project_approval': PointsCategory.PROJECT_APPROVAL,
      'investment': PointsCategory.INVESTMENT,
      'daily_login': PointsCategory.DAILY_LOGIN,
      'referral': PointsCategory.REFERRAL,
      'course_completion': PointsCategory.EDUCATIONAL_CONTENT,
      'community_post': PointsCategory.COMMUNITY_CONTRIBUTION
    };

    return categoryMap[activity] || PointsCategory.SPECIAL_EVENT;
  }

  /**
   * Batch track multiple activities
   */
  async trackMultipleActivities(userId: string, activities: Array<{
    type: EventType;
    metadata?: Record<string, any>;
  }>): Promise<void> {
    for (const activity of activities) {
      await this.engine.trackEvent(userId, activity.type, activity.metadata);
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    recentActivities: any[];
    streakInfo: {
      currentStreak: number;
      longestStreak: number;
      lastActivityDate: Date;
    };
  }> {
    // This would fetch from database
    console.log(`📊 Getting activity summary for user ${userId}`);

    return {
      totalActivities: 0,
      activitiesByType: {},
      recentActivities: [],
      streakInfo: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date()
      }
    };
  }

  /**
   * Calculate user engagement score
   */
  async calculateEngagementScore(userId: string): Promise<{
    score: number;
    level: string;
    factors: Record<string, number>;
  }> {
    const profile = await this.engine.getUserProfile(userId);
    if (!profile) {
      return { score: 0, level: 'inactive', factors: {} };
    }

    // Calculate engagement based on multiple factors
    const daysSinceJoin = Math.floor((Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const activityScore = Math.min(profile.totalPoints / Math.max(daysSinceJoin, 1), 100);
    const levelScore = (profile.currentLevel / 10) * 100;
    const streakScore = Math.min((profile.currentStreak / 30) * 100, 100);

    const totalScore = (activityScore * 0.5) + (levelScore * 0.3) + (streakScore * 0.2);

    let level = 'inactive';
    if (totalScore >= 80) level = 'highly_engaged';
    else if (totalScore >= 60) level = 'engaged';
    else if (totalScore >= 40) level = 'moderately_active';
    else if (totalScore >= 20) level = 'low_activity';

    return {
      score: Math.round(totalScore),
      level,
      factors: {
        activity: Math.round(activityScore),
        level: Math.round(levelScore),
        streak: Math.round(streakScore)
      }
    };
  }
}