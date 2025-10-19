"use client";

import { motion } from "framer-motion";
import { Lock, CheckCircle, Star } from "lucide-react";
import { Achievement, UserAchievement, AchievementRarity } from '../types';
import { cn } from "@saasfly/ui";

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

export function AchievementCard({
  achievement,
  userAchievement,
  onClick,
  size = 'md',
  showProgress = true,
  className
}: AchievementCardProps) {
  const isCompleted = userAchievement?.isCompleted || false;
  const progress = userAchievement?.progress || 0;
  const isLocked = !isCompleted && progress === 0;

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const rarityColors = {
    common: 'from-gray-500 to-gray-600 border-gray-500/30',
    uncommon: 'from-blue-500 to-blue-600 border-blue-500/30',
    rare: 'from-purple-500 to-purple-600 border-purple-500/30',
    epic: 'from-yellow-500 to-orange-500 border-yellow-500/30',
    legendary: 'from-red-500 via-pink-500 to-purple-500 border-red-500/30'
  };

  return (
    <motion.div
      whileHover={onClick && !isLocked ? { scale: 1.02 } : {}}
      whileTap={onClick && !isLocked ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        "relative bg-zinc-900/50 border rounded-xl backdrop-blur-sm transition-all duration-300 cursor-pointer",
        `bg-gradient-to-br ${rarityColors[achievement.rarity]}`,
        isLocked && "opacity-60 cursor-not-allowed",
        isCompleted && "ring-2 ring-lime-500/50",
        sizeClasses[size],
        className
      )}
    >
      {/* Rarity Indicator */}
      <div className="absolute top-2 right-2">
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-bold",
          achievement.rarity === 'legendary' && "bg-red-500/20 text-red-300",
          achievement.rarity === 'epic' && "bg-yellow-500/20 text-yellow-300",
          achievement.rarity === 'rare' && "bg-purple-500/20 text-purple-300",
          achievement.rarity === 'uncommon' && "bg-blue-500/20 text-blue-300",
          achievement.rarity === 'common' && "bg-gray-500/20 text-gray-300"
        )}>
          {achievement.rarity.toUpperCase()}
        </div>
      </div>

      {/* Achievement Icon */}
      <div className="flex items-center justify-center mb-3">
        <div className={cn(
          "rounded-full flex items-center justify-center",
          iconSizes[size],
          isCompleted
            ? "bg-lime-500 text-white"
            : isLocked
            ? "bg-zinc-700 text-zinc-500"
            : "bg-white/10 text-white"
        )}>
          {isCompleted ? (
            <CheckCircle className="w-2/3 h-2/3" />
          ) : isLocked ? (
            <Lock className="w-2/3 h-2/3" />
          ) : (
            <span className="text-2xl">{achievement.icon}</span>
          )}
        </div>
      </div>

      {/* Achievement Info */}
      <div className="text-center">
        <h3 className={cn(
          "font-bold mb-1",
          size === 'sm' ? 'text-sm' : 'text-lg',
          isCompleted ? "text-white" : "text-zinc-200"
        )}>
          {achievement.name}
        </h3>

        <p className={cn(
          "text-zinc-400 mb-2",
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {achievement.description}
        </p>

        {/* Points */}
        <div className="flex items-center justify-center gap-1 text-lime-400 mb-3">
          <Star className="w-4 h-4" />
          <span className="font-bold">{achievement.points} pts</span>
        </div>

        {/* Progress Bar */}
        {showProgress && !isCompleted && (
          <div className="mb-3">
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-gradient-to-r from-lime-500 to-emerald-500 h-2 rounded-full"
              />
            </div>
            <div className="text-xs text-zinc-500 text-center">
              {progress}% completado
            </div>
          </div>
        )}

        {/* Completion Date */}
        {isCompleted && userAchievement?.completedAt && (
          <div className="text-xs text-zinc-500">
            Completado: {new Date(userAchievement.completedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Secret Achievement Indicator */}
      {achievement.isSecret && !isCompleted && (
        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <div className="text-sm text-zinc-400">Logro Secreto</div>
          </div>
        </div>
      )}
    </motion.div>
  );
}