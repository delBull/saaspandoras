"use client";

import { motion } from "framer-motion";
import { TrendingUp, Trophy } from "lucide-react";
import { UserGamificationProfile } from '../types';

interface LevelProgressProps {
  profile: UserGamificationProfile;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LevelProgress({
  profile,
  showDetails = true,
  size = 'md',
  className = ''
}: LevelProgressProps) {
  const sizeClasses = {
    sm: {
      container: 'p-3',
      icon: 'w-8 h-8',
      progress: 'h-2',
      text: 'text-sm',
      title: 'text-base'
    },
    md: {
      container: 'p-4',
      icon: 'w-12 h-12',
      progress: 'h-3',
      text: 'text-base',
      title: 'text-lg'
    },
    lg: {
      container: 'p-6',
      icon: 'w-16 h-16',
      progress: 'h-4',
      text: 'text-lg',
      title: 'text-xl'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-zinc-900/50 border border-zinc-800 rounded-xl ${currentSize.container} ${className}`}
    >
      <div className="flex items-center gap-4">
        {/* Level Icon */}
        <div className={`${currentSize.icon} bg-gradient-to-br from-lime-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0`}>
          <Trophy className="w-1/2 h-1/2 text-white" />
        </div>

        {/* Level Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`font-bold text-white ${currentSize.title}`}>
              Nivel {profile.currentLevel}
            </h3>
            {showDetails && (
              <div className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full">
                {profile.totalPoints.toLocaleString()} pts totales
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className={`w-full bg-zinc-700 rounded-full ${currentSize.progress}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profile.levelProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-r from-lime-500 to-emerald-500 h-full rounded-full"
              />
            </div>
          </div>

          {/* Progress Text */}
          {showDetails && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">
                {profile.pointsToNextLevel.toLocaleString()} puntos para el siguiente nivel
              </span>
              <span className="text-lime-400 font-medium">
                {profile.levelProgress}% completado
              </span>
            </div>
          )}
        </div>

        {/* Next Level Preview */}
        {showDetails && (
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-zinc-400 mb-1">Siguiente</div>
            <div className="text-lg font-bold text-lime-400">
              Nivel {profile.currentLevel + 1}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}