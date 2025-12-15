// Main exports for gamification package
export * from './types';
export * from './core/gamification-engine';
export * from './core/points-manager';
export * from './core/achievement-manager';
export * from './core/reward-manager';
export * from './core/event-system';
export * from './core/leaderboard-manager';
export * from './hooks';
export * from './utils/tokenization-integration';
export * from './utils/database-service';

// Export components with namespace to avoid conflicts
export {
  GamificationHUD,
  AchievementCard,
  LevelProgress,
  LeaderboardComponent,
  RewardModal,
  GamificationDashboard,
  GamificationProvider,
  useGamificationContext
} from './components';

// Export singleton accessors (lazy initialization)
export const getGamificationEngine = () => GamificationEngine.getInstance();
export const getPointsManager = () => PointsManager.getInstance();
export const getAchievementManager = () => AchievementManager.getInstance();
export const getRewardManager = () => RewardManager.getInstance();
export const getEventSystem = () => EventSystem.getInstance();
export const getLeaderboardManager = () => LeaderboardManager.getInstance();
export const getTokenizationIntegration = () => TokenizationIntegration.getInstance();

// Deprecated: kept for backward compatibility but discouraged as they cause side effects
// wrapped in getters to avoid immediate execution
export const gamificationEngine = new Proxy({}, {
  get: (_target, prop) => (GamificationEngine.getInstance() as any)[prop]
}) as GamificationEngine;

export const pointsManager = new Proxy({}, {
  get: (_target, prop) => (PointsManager.getInstance() as any)[prop]
}) as PointsManager;

export const achievementManager = new Proxy({}, {
  get: (_target, prop) => (AchievementManager.getInstance() as any)[prop]
}) as AchievementManager;

export const rewardManager = new Proxy({}, {
  get: (_target, prop) => (RewardManager.getInstance() as any)[prop]
}) as RewardManager;

export const eventSystem = new Proxy({}, {
  get: (_target, prop) => (EventSystem.getInstance() as any)[prop]
}) as EventSystem;

export const leaderboardManager = new Proxy({}, {
  get: (_target, prop) => (LeaderboardManager.getInstance() as any)[prop]
}) as LeaderboardManager;

export const tokenizationIntegration = new Proxy({}, {
  get: (_target, prop) => (TokenizationIntegration.getInstance() as any)[prop]
}) as TokenizationIntegration;

// Re-export commonly used types
export type {
  UserGamificationProfile,
  UserLevel,
  UserPoints,
  Achievement,
  UserAchievement,
  Reward,
  UserReward,
  GamificationEvent,
  LeaderboardEntry
} from './types';

// Export managers as singletons
import { GamificationEngine } from './core/gamification-engine';
import { PointsManager } from './core/points-manager';
import { AchievementManager } from './core/achievement-manager';
import { RewardManager } from './core/reward-manager';
import { EventSystem } from './core/event-system';
import { LeaderboardManager } from './core/leaderboard-manager';
import { TokenizationIntegration } from './utils/tokenization-integration';