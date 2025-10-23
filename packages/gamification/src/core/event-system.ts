import {
  EventTrigger,
  GamificationEvent,
  EventType,
  ConditionType,
  ComparisonOperator,
  ActionType,
  UserGamificationProfile,
  TOKENIZATION_EVENT_TRIGGERS
} from '../types';

export class EventSystem {
  private static instance: EventSystem;

  public static getInstance(): EventSystem {
    if (!EventSystem.instance) {
      EventSystem.instance = new EventSystem();
    }
    return EventSystem.instance;
  }

  /**
   * Process incoming event and trigger actions
   */
  async processEvent(event: GamificationEvent): Promise<void> {
    console.log(`🎯 EventSystem: Processing event ${event.type} for user ${event.userId}`);

    // Get user profile for condition checking
    const userProfile = await this.getUserProfile(event.userId);
    if (!userProfile) return;

    // Get all active triggers
    const triggers = this.getActiveTriggers();

    for (const trigger of triggers) {
      if (await this.shouldTrigger(trigger, event, userProfile)) {
        await this.executeTriggerActions(trigger, event, userProfile);
      }
    }
  }

  /**
   * Check if trigger should fire
   */
  private async shouldTrigger(
    trigger: EventTrigger,
    event: GamificationEvent,
    userProfile: UserGamificationProfile
  ): Promise<boolean> {
    // Check if trigger is active
    if (!trigger.isActive) return false;

    // Check event type match
    if (trigger.eventType !== event.type) return false;

    // Check cooldown
    if (trigger.cooldown) {
      const lastTrigger = await this.getLastTriggerTime(trigger.id, event.userId);
      const timeSinceLastTrigger = Date.now() - lastTrigger.getTime();
      if (timeSinceLastTrigger < trigger.cooldown * 1000) {
        return false;
      }
    }

    // Check max triggers
    if (trigger.maxTriggers && trigger.currentTriggers >= trigger.maxTriggers) {
      return false;
    }

    // Check all conditions
    for (const condition of trigger.conditions) {
      if (!this.evaluateCondition(condition, userProfile, event)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute trigger actions
   */
  private async executeTriggerActions(
    trigger: EventTrigger,
    event: GamificationEvent,
    userProfile: UserGamificationProfile
  ): Promise<void> {
    console.log(`🚀 EventSystem: Executing trigger ${trigger.id} for user ${event.userId}`);

    for (const action of trigger.actions) {
      await this.executeAction(action, event, userProfile);

      // Add delay if specified
      if (action.delay) {
        await new Promise(resolve => setTimeout(resolve, (action.delay || 0) * 1000));
      }
    }

    // Update trigger count
    await this.updateTriggerCount(trigger.id, event.userId);
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(
    condition: any,
    userProfile: UserGamificationProfile,
    event: GamificationEvent
  ): boolean {
    let actualValue: any;

    switch (condition.type) {
      case ConditionType.USER_LEVEL:
        actualValue = userProfile.currentLevel;
        break;
      case ConditionType.USER_POINTS:
        actualValue = userProfile.totalPoints;
        break;
      case ConditionType.TOTAL_POINTS:
        actualValue = userProfile.totalPoints;
        break;
      case ConditionType.PROJECT_COUNT:
        actualValue = userProfile.projectsApplied;
        break;
      case ConditionType.INVESTMENT_AMOUNT:
        actualValue = userProfile.totalInvested;
        break;
      default:
        actualValue = 0;
    }

    return this.compareValues(actualValue, condition.operator, condition.value);
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: any, operator: ComparisonOperator, expected: any): boolean {
    switch (operator) {
      case ComparisonOperator.EQUALS:
        return actual === expected;
      case ComparisonOperator.GREATER_THAN:
        return actual > expected;
      case ComparisonOperator.LESS_THAN:
        return actual < expected;
      case ComparisonOperator.GREATER_EQUAL:
        return actual >= expected;
      case ComparisonOperator.LESS_EQUAL:
        return actual <= expected;
      case ComparisonOperator.NOT_EQUALS:
        return actual !== expected;
      case ComparisonOperator.CONTAINS:
        return String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  /**
   * Execute action
   */
  private async executeAction(
    action: any,
    event: GamificationEvent,
    userProfile: UserGamificationProfile
  ): Promise<void> {
    switch (action.type) {
      case ActionType.AWARD_POINTS:
        console.log(`🎯 Awarding ${action.value} points to user ${event.userId}`);
        // This would call the points manager
        break;

      case ActionType.UNLOCK_ACHIEVEMENT:
        console.log(`🏆 Unlocking achievement ${action.value} for user ${event.userId}`);
        // This would call the achievement manager
        break;

      case ActionType.GRANT_REWARD:
        console.log(`🎁 Granting reward ${action.value} to user ${event.userId}`);
        // This would call the reward manager
        break;

      case ActionType.SEND_NOTIFICATION:
        console.log(`🔔 Sending notification to user ${event.userId}:`, action.value);
        // This would call the notification system
        break;

      default:
        console.log(`⚠️ Unknown action type: ${action.type}`);
    }
  }

  /**
   * Get active triggers
   */
  private getActiveTriggers(): EventTrigger[] {
    return TOKENIZATION_EVENT_TRIGGERS.filter(trigger => trigger.isActive);
  }

  /**
   * Get last trigger time for user
   */
  private async getLastTriggerTime(triggerId: string, userId: string): Promise<Date> {
    // This would fetch from database
    return new Date(0); // Return epoch if no previous triggers
  }

  /**
   * Update trigger count
   */
  private async updateTriggerCount(triggerId: string, userId: string): Promise<void> {
    // This would update the database
    console.log(`💾 Updated trigger count for ${triggerId}, user ${userId}`);
  }

  /**
   * Get user profile (mock implementation)
   */
  private async getUserProfile(userId: string): Promise<UserGamificationProfile | null> {
    // This would fetch from database
    return {
      id: `profile_${userId}`,
      userId,
      walletAddress: userId,
      totalPoints: 0,
      currentLevel: 1,
      pointsToNextLevel: 100,
      levelProgress: 0,
      projectsApplied: 0,
      projectsApproved: 0,
      totalInvested: 0,
      communityContributions: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date(),
      totalActiveDays: 0,
      referralsCount: 0,
      communityRank: 0,
      reputationScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Register new event trigger
   */
  async registerTrigger(trigger: EventTrigger): Promise<void> {
    console.log(`🔧 EventSystem: Registering new trigger ${trigger.id}`);
    // This would save to database
  }

  /**
   * Get trigger statistics
   */
  async getTriggerStats(triggerId: string): Promise<{
    totalTriggers: number;
    uniqueUsers: number;
    lastTriggered: Date;
    averageTriggerInterval: number;
  }> {
    // This would fetch from database
    return {
      totalTriggers: 0,
      uniqueUsers: 0,
      lastTriggered: new Date(),
      averageTriggerInterval: 0
    };
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    totalEvents: number;
    totalTriggers: number;
    activeTriggers: number;
    eventsPerHour: number;
  }> {
    // This would fetch from database
    return {
      totalEvents: 0,
      totalTriggers: TOKENIZATION_EVENT_TRIGGERS.length,
      activeTriggers: TOKENIZATION_EVENT_TRIGGERS.filter(t => t.isActive).length,
      eventsPerHour: 0
    };
  }
}