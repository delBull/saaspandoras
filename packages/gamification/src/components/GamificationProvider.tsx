"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useGamification } from '../hooks';
import { GamificationHUD } from './GamificationHUD';

interface GamificationContextType {
  profile: any;
  achievements: any[];
  rewards: any[];
  leaderboard: any[];
  isLoading: boolean;
  error: string | null;
  trackEvent: (eventType: any, metadata?: any) => Promise<void>;
  awardPoints: (points: number, reason: string, category: any, metadata?: any) => Promise<void>;
  refresh: () => void;
  currentLevel: number;
  totalPoints: number;
  levelProgress: number;
  completedAchievements: any[];
  availableRewards: any[];
}

const GamificationContext = createContext<GamificationContextType | null>(null);

interface GamificationProviderProps {
  children: ReactNode;
  userId: string;
  showHUD?: boolean;
  hudPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function GamificationProvider({
  children,
  userId,
  showHUD = true,
  hudPosition = 'top-right',
  autoRefresh = true,
  refreshInterval = 30000
}: GamificationProviderProps) {
  const gamification = useGamification({
    userId,
    autoRefresh,
    refreshInterval
  });

  return (
    <GamificationContext.Provider value={gamification}>
      {children}
      {showHUD && (
        <GamificationHUD
          profile={gamification.profile}
          isVisible={!!gamification.profile}
          position={hudPosition}
        />
      )}
    </GamificationContext.Provider>
  );
}

export function useGamificationContext() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamificationContext must be used within GamificationProvider');
  }
  return context;
}