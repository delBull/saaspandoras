"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  UserGamificationProfile,
  UserAchievement,
  Reward,
  LeaderboardEntry,
  EventType,
  PointsCategory
} from '../types';
import { GamificationEngine } from '../core/gamification-engine';

interface UseGamificationOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useGamification({
  userId,
  autoRefresh = true,
  refreshInterval = 30000
}: UseGamificationOptions) {
  const [profile, setProfile] = useState<UserGamificationProfile | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user gamification data
  const loadData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load profile
      const userProfile = await GamificationEngine.getInstance().getUserProfile(userId);
      setProfile(userProfile);

      // Load achievements (mock - would be from API)
      const userAchievements = await GamificationEngine.getInstance().getUserAchievements(userId);
      setAchievements(userAchievements);

      // Load available rewards (mock - would be from API)
      const availableRewards = await GamificationEngine.getInstance().getAvailableRewards(userId);
      setRewards(availableRewards);

      // Load leaderboard (mock - would be from API)
      const leaderboardData = await GamificationEngine.getInstance().getLeaderboard('global', 10);
      setLeaderboard(leaderboardData);

    } catch (err) {
      console.error('Error loading gamification data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Track gamification event
  const trackEvent = useCallback(async (
    eventType: EventType,
    metadata?: Record<string, unknown>
  ) => {
    try {
      await GamificationEngine.getInstance().trackEvent(userId, eventType, metadata);
      // Refresh data after tracking event
      await loadData();
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  }, [userId, loadData]);

  // Award points
  const awardPoints = useCallback(async (
    points: number,
    reason: string,
    category: PointsCategory,
    metadata?: Record<string, unknown>
  ) => {
    try {
      await GamificationEngine.getInstance().awardPoints(userId, points, reason, category, metadata);
      // Refresh data after awarding points
      await loadData();
    } catch (err) {
      console.error('Error awarding points:', err);
    }
  }, [userId, loadData]);

  // Initialize data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData, userId]);

  return {
    // Data
    profile,
    achievements,
    rewards,
    leaderboard,

    // State
    isLoading,
    error,

    // Actions
    trackEvent,
    awardPoints,
    refresh: loadData,

    // Computed values
    currentLevel: profile?.currentLevel || 1,
    totalPoints: profile?.totalPoints || 0,
    levelProgress: profile?.levelProgress || 0,
  };
}