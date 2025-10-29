/* eslint-disable react/no-unescaped-entities */

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@saasfly/ui/button';
import {
  AchievementCard,
  GamificationDashboard,
  LeaderboardComponent,
  RewardModal,
  TOKENIZATION_ACHIEVEMENTS,
  TOKENIZATION_REWARDS,
  type Achievement,
  type Reward,
  type UserAchievement,
  type UserGamificationProfile,
  type LeaderboardEntry,
} from '@pandoras/gamification';

interface GamificationData {
  profile: UserGamificationProfile | null;
  achievements: UserAchievement[];
  rewards: Reward[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
}

async function loadGamificationDataForClient() {
  try {
    const { getUserGamificationProfile, getAvailableGamificationRewards, getGamificationLeaderboard } = await import('@/lib/gamification/service');

    const [profile, rewards, leaderboard] = await Promise.all([
      getUserGamificationProfile('demo-user-123'),
      getAvailableGamificationRewards('demo-user-123'),
      getGamificationLeaderboard('points', 10)
    ]);

    return {
      profile,
      rewards,
      leaderboard,
    };
  } catch (error) {
    console.error('Error loading gamification data:', error);
    return {
      profile: null,
      rewards: [],
      leaderboard: [],
    };
  }
}

async function handleTrackEventForClient(eventType: string) {
  try {
    const { trackGamificationEvent } = await import('@/lib/gamification/service');
    await trackGamificationEvent('demo-user-123', eventType);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

export default function GamificationDemoPage() {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [gamificationData, setGamificationData] = useState<GamificationData>({
    profile: null,
    achievements: [],
    rewards: [],
    leaderboard: [],
    isLoading: true
  });

  // Load gamification data on component mount
  useEffect(() => {
    void loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    setGamificationData(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await loadGamificationDataForClient();

      setGamificationData({
        profile: result.profile,
        achievements: [],
        rewards: result.rewards,
        leaderboard: result.leaderboard,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading gamification data:', error);
      setGamificationData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleTrackEvent = async (eventType: string) => {
    try {
      await handleTrackEventForClient(eventType);
      await loadGamificationData();
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-lime-200 to-white bg-clip-text text-transparent">
              Sistema de Gamificación
            </span>
            <br />
            <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
              Pandora's Finance
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Demo del sistema de gamificación con base de datos real.
          </p>
        </motion.div>

        {/* Demo Content */}
        <div className="space-y-8">
          <GamificationDashboard
            profile={gamificationData.profile}
            achievements={gamificationData.achievements}
            rewards={gamificationData.rewards}
            leaderboard={gamificationData.leaderboard}
            isLoading={gamificationData.isLoading}
          />

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🏆 Logros Disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOKENIZATION_ACHIEVEMENTS.map((achievement: Achievement, index: number) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AchievementCard
                    achievement={achievement}
                    showProgress={true}
                    size="md"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🎁 Recompensas Disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOKENIZATION_REWARDS.map((reward: Reward, index: number) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 cursor-pointer hover:border-purple-400/50 transition-colors"
                  onClick={() => {
                    setSelectedReward(reward);
                    setShowRewardModal(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{reward.icon}</div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm">{reward.name}</div>
                      <div className="text-xs text-zinc-400">{reward.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-purple-400">{reward.value}</div>
                      <div className="text-xs text-zinc-500">valor</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🏅 Tabla de Líderes</h2>
            <LeaderboardComponent
              entries={gamificationData.leaderboard}
              currentUserId="demo-user-123"
              maxEntries={10}
              showUserHighlight={true}
            />
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🎮 Controles de Demo</h2>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => handleTrackEvent('project_application_submitted')}
                className="bg-lime-500 hover:bg-lime-600 text-black font-bold"
              >
                Simular Aplicación (+50 pts)
              </Button>
              <Button
                onClick={() => handleTrackEvent('daily_login')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
              >
                Simular Login Diario (+10 pts)
              </Button>
              <Button
                onClick={() => handleTrackEvent('referral_made')}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
              >
                Simular Referido (+200 pts)
              </Button>
              <Button
                onClick={loadGamificationData}
                className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold"
              >
                Actualizar Datos
              </Button>
            </div>
          </div>

          <RewardModal
            reward={selectedReward}
            isOpen={showRewardModal}
            onClose={() => setShowRewardModal(false)}
            onClaim={() => {
              console.log('🎁 Recompensa reclamada:', selectedReward?.name);
              setShowRewardModal(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
