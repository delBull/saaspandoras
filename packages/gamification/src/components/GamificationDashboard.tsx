"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Trophy,
  Star,
  Target,
  Award,
  Gift,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Zap
} from "lucide-react";
import { UserGamificationProfile, UserAchievement, Reward, LeaderboardEntry } from '../types';
import { cn } from "../utils/cn";

interface GamificationDashboardProps {
  profile: UserGamificationProfile | null;
  achievements: UserAchievement[];
  rewards: Reward[];
  leaderboard: LeaderboardEntry[];
  isLoading?: boolean;
  className?: string;
}

export function GamificationDashboard({
  profile,
  achievements,
  rewards,
  leaderboard,
  isLoading = false,
  className
}: GamificationDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-zinc-700 rounded mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-20 bg-zinc-700 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="text-zinc-400">No se pudo cargar el perfil de gamificación</div>
      </div>
    );
  }

  const completedAchievements = achievements.filter(a => a.isCompleted);
  const availableRewards = rewards.filter(r => r.isActive);
  const recentAchievements = completedAchievements.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("space-y-6", className)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border border-lime-500/20 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-lime-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Perfil de Gamificación</h2>
            <p className="text-zinc-400">Tu progreso y logros en la plataforma</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-lime-400">{profile.currentLevel}</div>
            <div className="text-sm text-zinc-400">Nivel Actual</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{profile.totalPoints.toLocaleString()}</div>
            <div className="text-sm text-zinc-400">Puntos Totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{completedAchievements.length}</div>
            <div className="text-sm text-zinc-400">Logros</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{profile.currentStreak}</div>
            <div className="text-sm text-zinc-400">Racha Actual</div>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-lime-400" />
          <h3 className="text-xl font-bold text-white">Progreso de Nivel</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Nivel {profile.currentLevel}</span>
            <span className="text-zinc-400">Nivel {profile.currentLevel + 1}</span>
          </div>

          <div className="w-full bg-zinc-700 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profile.levelProgress}%` }}
              className="bg-gradient-to-r from-lime-500 to-emerald-500 h-3 rounded-full"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">
              {profile.pointsToNextLevel.toLocaleString()} puntos restantes
            </span>
            <span className="text-lime-400 font-medium">
              {profile.levelProgress}% completado
            </span>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Logros Recientes</h3>
        </div>

        {recentAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4 text-center"
              >
                <div className="text-3xl mb-2">🏆</div>
                <div className="font-bold text-white text-sm mb-1">
                  {achievement.metadata?.name || 'Logro Desconocido'}
                </div>
                <div className="text-xs text-zinc-400">
                  +{achievement.metadata?.points || 0} puntos
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aún no has desbloqueado logros</p>
            <p className="text-sm">¡Sigue participando para ganar tus primeros logros!</p>
          </div>
        )}
      </div>

      {/* Available Rewards */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Recompensas Disponibles</h3>
        </div>

        {availableRewards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRewards.slice(0, 4).map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{reward.icon}</div>
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
        ) : (
          <div className="text-center py-8 text-zinc-400">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay recompensas disponibles en este momento</p>
            <p className="text-sm">¡Sigue subiendo de nivel para desbloquear más recompensas!</p>
          </div>
        )}
      </div>

      {/* Activity Summary */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Resumen de Actividad</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{profile.projectsApplied}</div>
            <div className="text-sm text-zinc-400">Protocolos Aplicadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{profile.projectsApproved}</div>
            <div className="text-sm text-zinc-400">Protocolos Aprobadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{profile.communityContributions}</div>
            <div className="text-sm text-zinc-400">Contribuciones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-400">{profile.referralsCount}</div>
            <div className="text-sm text-zinc-400">Referidos</div>
          </div>
        </div>
      </div>

      {/* Top Leaderboard Preview */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-white">Top de la Comunidad</h3>
        </div>

        {leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.slice(0, 3).map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-lime-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  #{entry.rank}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">
                    {entry.userName || `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`}
                  </div>
                  <div className="text-xs text-zinc-400">Nivel {entry.currentLevel}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-lime-400">{entry.totalPoints.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500">puntos</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Cargando tabla de líderes...</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
