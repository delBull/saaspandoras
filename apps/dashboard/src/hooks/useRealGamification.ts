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

  // Function to refresh all data synchronously
  const refreshData = useCallback(async () => {
    if (!userId) return;

    try {
      console.log('🎮 Fetching real gamification data for user:', userId);
      setIsLoading(true);

      // Fetch data from new client-safe API
      const response = await fetch(`/api/gamification/user/data/${userId}`);

      if (!response.ok) {
        console.warn('⚠️ Gamification API failed, using fallback');
        // Fallback to empty data if API fails
        setProfile(null);
        setAchievements([]);
        setRewards([]);
        setLeaderboard([]);
        setTotalPoints(0);
        setCurrentLevel(1);
        setLevelProgress(0);
        return;
      }

      const data = await response.json() as {
        profile: UserGamificationProfile | null;
        achievements: UserAchievement[];
        rewards: Reward[];
        leaderboard: LeaderboardEntry[];
        totalPoints: number;
        currentLevel: number;
        levelProgress: number;
      };

      // Update state with real data
      setProfile(data.profile);
      setAchievements(data.achievements);
      setRewards(data.rewards);
      setLeaderboard(data.leaderboard);
      setTotalPoints(data.totalPoints);
      setCurrentLevel(data.currentLevel);
      setLevelProgress(data.levelProgress);

      console.log('✅ Real gamification data loaded:', {
        profile: !!data.profile,
        achievements: data.achievements.length,
        points: data.totalPoints
      });

    } catch (error) {
      console.error('❌ Error fetching gamification data:', error);
      // Fallback to empty data on error
      setProfile(null);
      setAchievements([]);
      setRewards([]);
      setLeaderboard([]);
      setTotalPoints(0);
      setCurrentLevel(1);
      setLevelProgress(0);
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
      refreshData();
      console.log('🎯 Event tracking attempted and data refreshed:', eventType);
    } catch (error) {
      console.error('❌ Error tracking gamification event:', error);
      // Still refresh data even if tracking failed
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
