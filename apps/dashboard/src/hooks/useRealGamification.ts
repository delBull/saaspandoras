'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  UserGamificationProfile,
  UserAchievement,
  Reward,
  LeaderboardEntry
} from '@pandoras/gamification';

interface RealTimeGamificationData {
  profile: UserGamificationProfile | null;
  achievements: UserAchievement[];
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
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);

  // Function to refresh all data by calling APIs
  const refreshData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Headers for API authentication
      const authHeaders = {
        'X-Wallet-Address': userId,
        'Content-Type': 'application/json',
      };

      // Load all data in parallel via API calls (client-safe)
      const [profileResponse, achievementsResponse, rewardsResponse, leaderboardResponse] = await Promise.all([
        fetch(`/api/gamification/profile/${userId}`),
        fetch('/api/gamification/user/achievements', { headers: authHeaders }),
        fetch(`/api/gamification/rewards/${userId}`),
        fetch('/api/gamification/leaderboard/points')
      ]);

      // Parse responses and handle potential errors with proper typing
      const profileData = profileResponse.ok ? await profileResponse.json() as UserGamificationProfile | null : null;
      const achievementsData = achievementsResponse.ok ? await achievementsResponse.json() as UserAchievement[] : [];
      const rewardsData = rewardsResponse.ok ? await rewardsResponse.json() as Reward[] : [];
      const leaderboardData = leaderboardResponse.ok ? await leaderboardResponse.json() as LeaderboardEntry[] : [];

      setProfile(profileData);
      setAchievements(achievementsData);
      setRewards(rewardsData);
      setLeaderboard(leaderboardData);

      // Extract stats from profile safely
      if (profileData) {
        setTotalPoints((profileData as { totalPoints?: number }).totalPoints ?? 0);
        setCurrentLevel((profileData as { currentLevel?: number }).currentLevel ?? 1);
        setLevelProgress((profileData as { levelProgress?: number }).levelProgress ?? 0);
      }

      console.log('🎮 Real gamification data loaded for user:', userId, {
        profile: !!profileData,
        achievements: Array.isArray(achievementsData) ? achievementsData.length : 0,
        rewards: Array.isArray(rewardsData) ? rewardsData.length : 0,
        leaderboard: Array.isArray(leaderboardData) ? leaderboardData.length : 0
      });
    } catch (error) {
      console.error('❌ Error loading real gamification data:', error);
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
          // Include wallet address for authentication
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
      await refreshData();
      console.log('🎯 Event tracking attempted and data refreshed:', eventType);
    } catch (error) {
      console.error('❌ Error tracking gamification event:', error);
      // Still refresh data even if tracking failed
      await refreshData();
    }
  }, [userId, refreshData]);

  // Load data on mount and user change
  useEffect(() => {
    void refreshData();
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
