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
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon ?? '🏆',

        // 🔥 EXPLICIT SEMANTICS
        category: normalizeCategory(a.category || a.type),
        rarity: normalizeRarity(a.rarity || a.type),

        pointsReward: Number(a.pointsReward ?? a.points ?? 0),

        progress: Number(a.progress ?? 0),
        required: Number(a.required ?? 1),

        isUnlocked: Boolean(a.isUnlocked ?? a.isCompleted ?? false),
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

  // Load data on mount and user change
  useEffect(() => {
    refreshData();
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

/* ---------------- helpers ---------------- */

function normalizeCategory(raw: string): 'community' | 'investor' | 'creator' | 'expert' {
  const val = String(raw).toLowerCase();
  if (['investor', 'defi_starter', 'high_roller'].includes(val)) return 'investor';
  if (['creator', 'artifact_collector'].includes(val)) return 'creator';
  if (['expert', 'tokenization_expert', 'early_adopter', 'governor', 'yield_hunter', 'dao_pioneer'].includes(val)) return 'expert';
  return 'community';
}

function normalizeRarity(raw: string): 'first_steps' | 'investor' | 'community_builder' | 'early_adopter' | 'high_roller' {
  const val = String(raw).toLowerCase();
  if (['high_roller', 'tokenization_expert', 'dao_pioneer'].includes(val)) return 'high_roller';
  if (['early_adopter', 'governor', 'yield_hunter'].includes(val)) return 'early_adopter';
  if (['community_builder', 'creator'].includes(val)) return 'community_builder';
  if (['investor', 'defi_starter'].includes(val)) return 'investor';
  return 'first_steps';
}
