"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useGamification } from '../hooks';
import { GamificationHUD } from './GamificationHUD';
import {
  UserGamificationProfile,
  UserAchievement,
  Reward,
  LeaderboardEntry,
  EventType,
  PointsCategory
} from '../types';

// Definir la interfaz del contexto (igual a lo que devuelve el hook)
interface GamificationContextType {
  profile: UserGamificationProfile | null;
  achievements: UserAchievement[];
  rewards: Reward[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  trackEvent: (eventType: EventType, metadata?: Record<string, unknown>) => Promise<void>;
  awardPoints: (points: number, reason: string, category: PointsCategory, metadata?: Record<string, unknown>) => Promise<void>;
  refresh: () => void;
  currentLevel: number;
  totalPoints: number;
  levelProgress: number;
  // Propiedades computadas adicionales para compatibilidad
  completedAchievements: UserAchievement[];
  availableRewards: Reward[];
}

// Crear el contexto
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

  // Crear el contexto value con propiedades computadas adicionales
  const contextValue: GamificationContextType = {
    ...gamification,
    completedAchievements: gamification.achievements.filter((a: UserAchievement) => a.isCompleted),
    availableRewards: gamification.rewards.filter((r: Reward) => r.isActive)
  };

  return (
    <GamificationContext.Provider value={contextValue}>
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

// Hook para usar el contexto de gamificación
export function useGamificationContext() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamificationContext must be used within GamificationProvider');
  }
  return context;
}