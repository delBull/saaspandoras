"use client";

import { motion } from "framer-motion";
import { Trophy, Star, Zap, Target } from "lucide-react";
import { UserGamificationProfile } from '../types';

interface GamificationHUDProps {
  profile: UserGamificationProfile | null;
  isVisible?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export function GamificationHUD({
  profile,
  isVisible = true,
  position = 'top-right',
  className = ''
}: GamificationHUDProps) {
  if (!profile || !isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      className={`fixed ${positionClasses[position]} z-40 ${className}`}
    >
      <div className="bg-zinc-900/90 backdrop-blur-sm border border-lime-500/30 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-4">
          {/* Level Badge */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-lime-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-zinc-400">Nivel</div>
              <div className="font-bold text-white">{profile.currentLevel}</div>
            </div>
          </div>

          {/* Points Display */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-zinc-400">Puntos</div>
              <div className="font-bold text-white">{profile.totalPoints.toLocaleString()}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-32">
            <div className="text-xs text-zinc-400 mb-1">Progreso al siguiente nivel</div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profile.levelProgress}%` }}
                className="bg-gradient-to-r from-lime-500 to-emerald-500 h-2 rounded-full"
              />
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {profile.pointsToNextLevel} puntos restantes
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}