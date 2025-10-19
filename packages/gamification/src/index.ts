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

// Export singleton instances
export const gamificationEngine = GamificationEngine.getInstance();
export const pointsManager = PointsManager.getInstance();
export const achievementManager = AchievementManager.getInstance();
export const rewardManager = RewardManager.getInstance();
export const eventSystem = EventSystem.getInstance();
export const leaderboardManager = LeaderboardManager.getInstance();
export const tokenizationIntegration = TokenizationIntegration.getInstance();

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