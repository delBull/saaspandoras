'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  UserGamificationProfile,
  UserAchievement,
  Reward,
  LeaderboardEntry
} from '@pandoras/gamification';

export interface GamificationAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;

  category: 'community' | 'investor' | 'creator' | 'expert';
  rarity: 'first_steps' | 'investor' | 'community_builder' | 'early_adopter' | 'high_roller';

  pointsReward: number;

  progress: number;
  required: number;
  isUnlocked: boolean;
}

interface RealTimeGamificationData {
  profile: UserGamificationProfile | null;
  achievements: GamificationAchievement[];
  rewards: Reward[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  totalPoints: number;
  currentLevel: number;
  levelProgress: number;
  refreshData: () => Promise<void>;
  trackNewEvent: (eventType: string, metadata?: Record<string, unknown>) => Promise<void>;
}

// 🔥 HELPER: Map database 'type' to UI 'category' for filtering and icons
function mapTypeToCategory(type: string): 'community' | 'investor' | 'creator' | 'expert' {
  if (!type) return 'community';

  const t = type.toLowerCase();
  if (t.includes('community')) return 'community';
  if (t.includes('creator') || t.includes('projects') || t.includes('tokenization')) return 'creator';
  if (t.includes('invest') || t.includes('defi') || t.includes('yield') || t.includes('staking') || t.includes('governor') || t.includes('dao')) return 'investor';
  if (t.includes('learning') || t.includes('expert') || t.includes('streak') || t.includes('explorer')) return 'expert';

  return 'community';
}

// 🔥 HELPER: Map database 'type' to UI 'rarity' for styling
function mapTypeToRarity(type: string): 'first_steps' | 'investor' | 'community_builder' | 'early_adopter' | 'high_roller' {
  if (!type) return 'first_steps';

  const t = type.toLowerCase();
  if (t.includes('early')) return 'early_adopter';
  if (t.includes('collector') || t.includes('whale') || t.includes('high_roller')) return 'high_roller';
  if (t.includes('community')) return 'community_builder';
  if (t.includes('invest')) return 'investor';

  return 'first_steps';
}

// Custom Hook para conectar con sistema gamificación real y persistente
export function useRealGamification(userId?: string): RealTimeGamificationData {
  const [profile, setProfile] = useState<UserGamificationProfile | null>(null);
  const [achievements, setAchievements] = useState<GamificationAchievement[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);

  // Function to refresh all data synchronously
  const refreshData = useCallback(async () => {
    if (!userId) {
      setAchievements([]);
      setProfile(null);
      setTotalPoints(0);
      setCurrentLevel(1);
      setLevelProgress(0);
      return;
    }

    try {
      console.log('🎮 [useRealGamification] Fetching data for user:', userId);
      setIsLoading(true);

      // Fetch data from new client-safe API
      const response = await fetch(`/api/gamification/user/data/${userId}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`API failed with status ${response.status}`);
      }

      const data = await response.json();

      // 🔥 ANTI-CORRUPTION LAYER: Normalizar datos del backend
      const normalizedAchievements: GamificationAchievement[] = (data.achievements || []).map((a: any) => ({
        id: String(a.id || a.achievementId || a.achievement_id),
        name: a.name || 'Logro sin nombre',
        description: a.description || '',
        icon: a.icon || '🏆',

        // 🔥 EXPLICIT SEMANTICS (Fixing user mismatch)
        // Asegura que lea 'type' de la BD o los campos ya mapeados del API
        category: mapTypeToCategory(a.type || a.category),
        rarity: mapTypeToRarity(a.type || a.rarity),

        pointsReward: Number(a.pointsReward ?? a.points_reward ?? a.points ?? 0),

        progress: Number(a.progress ?? 0),
        required: Number(a.required ?? a.required_points ?? a.requiredPoints ?? 1),

        isUnlocked: Boolean(a.isUnlocked ?? a.is_unlocked ?? a.isCompleted ?? false),
      }));

      // Update state with normalized data
      setProfile(data.profile);
      setAchievements(normalizedAchievements);
      setRewards(data.rewards || []);
      setLeaderboard(data.leaderboard || []);
      setTotalPoints(Number(data.totalPoints ?? data.profile?.totalPoints ?? 0));
      setCurrentLevel(Number(data.currentLevel ?? data.profile?.currentLevel ?? 1));
      setLevelProgress(Number(data.levelProgress ?? data.profile?.levelProgress ?? 0));

      console.log(`✅ [useRealGamification] Loaded ${normalizedAchievements.length} achievements`);

    } catch (error) {
      console.error('❌ [useRealGamification] Error:', error);
      // Mantener silencio si falla para no romper UI, pero resetear cargando
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Function to track new events via API
  const trackNewEvent = useCallback(async (eventType: string, metadata?: Record<string, unknown>) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/gamification/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': userId,
        },
        body: JSON.stringify({
          walletAddress: userId,
          eventType,
          metadata
        })
      });

      if (!response.ok) {
        console.warn('⚠️ Gamification event tracking failed:', await response.text());
      }

      // Refresh data after event tracking attempt
      refreshData();
    } catch (error) {
      console.error('❌ Error tracking gamification event:', error);
      refreshData();
    }
  }, [userId, refreshData]);

  // Load data on mount and user change with periodic refresh
  useEffect(() => {
    refreshData();

    // 🛡️ Optimization: Periodic refresh every 5 mins but ONLY if the tab is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    profile,
    achievements,
    rewards,
    leaderboard,
    isLoading,
    totalPoints,
    currentLevel,
    levelProgress,
    refreshData,
    trackNewEvent
  };
}


