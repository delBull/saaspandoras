// Event system types for gamification
export interface GamificationEvent {
  id: string;
  userId: string;
  type: EventType;
  category: EventCategory;
  points: number;
  metadata?: Record<string, any>;

  // Context
  projectId?: string;
  achievementId?: string;
  rewardId?: string;

  // Timestamps
  createdAt: Date;
  processedAt?: Date;
}

export interface EventTrigger {
  id: string;
  eventType: EventType;
  conditions: EventCondition[];
  actions: EventAction[];
  isActive: boolean;
  cooldown?: number; // Minimum time between triggers in seconds
  maxTriggers?: number; // Maximum times this can trigger
  currentTriggers: number;
}

export interface EventCondition {
  type: ConditionType;
  field: string;
  operator: ComparisonOperator;
  value: any;
}

export interface EventAction {
  type: ActionType;
  target: string;
  value: any;
  delay?: number; // Delay in seconds before executing
}

export enum EventType {
  // Project Events
  PROJECT_APPLICATION_SUBMITTED = 'project_application_submitted',
  PROJECT_APPLICATION_APPROVED = 'project_application_approved',
  PROJECT_APPLICATION_REJECTED = 'project_application_rejected',

  // Investment Events
  INVESTMENT_MADE = 'investment_made',
  INVESTMENT_RETURNED = 'investment_returned',
  PORTFOLIO_MILESTONE = 'portfolio_milestone',

  // Community Events
  USER_REGISTERED = 'user_registered',
  PROFILE_COMPLETED = 'profile_completed',
  REFERRAL_MADE = 'referral_made',
  COMMUNITY_POST = 'community_post',

  // Learning Events
  COURSE_STARTED = 'course_started',
  COURSE_COMPLETED = 'course_completed',
  QUIZ_PASSED = 'quiz_passed',

  // Daily Events
  DAILY_LOGIN = 'daily_login',
  STREAK_MILESTONE = 'streak_milestone',

  // Special Events
  BETA_ACCESS = 'beta_access',
  FEATURE_UNLOCK = 'feature_unlock',
  MILESTONE_REACHED = 'milestone_reached'
}

export enum EventCategory {
  PROJECTS = 'projects',
  INVESTMENTS = 'investments',
  COMMUNITY = 'community',
  LEARNING = 'learning',
  DAILY = 'daily',
  SPECIAL = 'special'
}

export enum ConditionType {
  USER_LEVEL = 'user_level',
  USER_POINTS = 'user_points',
  USER_ACHIEVEMENTS = 'user_achievements',
  PROJECT_COUNT = 'project_count',
  INVESTMENT_AMOUNT = 'investment_amount',
  TIME_BASED = 'time_based',
  RANDOM = 'random',
  TOTAL_POINTS = 'total_points'
}

export enum ComparisonOperator {
  EQUALS = 'equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  CONTAINS = 'contains',
  NOT_EQUALS = 'not_equals'
}

export enum ActionType {
  AWARD_POINTS = 'award_points',
  UNLOCK_ACHIEVEMENT = 'unlock_achievement',
  GRANT_REWARD = 'grant_reward',
  SEND_NOTIFICATION = 'send_notification',
  UPDATE_LEVEL = 'update_level',
  TRIGGER_WEBHOOK = 'trigger_webhook'
}

// Predefined event triggers for tokenization platform
export const TOKENIZATION_EVENT_TRIGGERS: EventTrigger[] = [
  {
    id: 'first_application_points',
    eventType: EventType.PROJECT_APPLICATION_SUBMITTED,
    conditions: [
      {
        type: ConditionType.PROJECT_COUNT,
        field: 'applications',
        operator: ComparisonOperator.EQUALS,
        value: 1
      }
    ],
    actions: [
      {
        type: ActionType.AWARD_POINTS,
        target: 'user',
        value: 50
      },
      {
        type: ActionType.SEND_NOTIFICATION,
        target: 'user',
        value: { type: 'achievement_unlocked', achievement: 'first_application' }
      }
    ],
    isActive: true,
    currentTriggers: 0
  },
  {
    id: 'daily_login_streak',
    eventType: EventType.DAILY_LOGIN,
    conditions: [
      {
        type: ConditionType.TIME_BASED,
        field: 'lastLogin',
        operator: ComparisonOperator.GREATER_THAN,
        value: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      }
    ],
    actions: [
      {
        type: ActionType.AWARD_POINTS,
        target: 'user',
        value: 10
      }
    ],
    isActive: true,
    cooldown: 24 * 60 * 60, // 24 hours
    currentTriggers: 0
  },
  {
    id: 'investment_milestone',
    eventType: EventType.PORTFOLIO_MILESTONE,
    conditions: [
      {
        type: ConditionType.INVESTMENT_AMOUNT,
        field: 'totalInvested',
        operator: ComparisonOperator.GREATER_EQUAL,
        value: 1000
      }
    ],
    actions: [
      {
        type: ActionType.AWARD_POINTS,
        target: 'user',
        value: 100
      },
      {
        type: ActionType.UNLOCK_ACHIEVEMENT,
        target: 'user',
        value: 'investor_milestone'
      }
    ],
    isActive: true,
    currentTriggers: 0
  }
];