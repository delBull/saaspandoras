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
      <div className="bg-black/80 backdrop-blur-md border border-lime-500/50 rounded-lg p-4 shadow-[0_0_20px_rgba(132,204,22,0.2)]">
        <div className="flex items-center gap-5">
          {/* Level Badge - Hexagon Style */}
          <div className="relative group">
            <div className="absolute inset-0 bg-lime-500/20 blur-lg rounded-full animate-pulse" />
            <div className="w-12 h-12 bg-zinc-900 border-2 border-lime-500 rounded-lg rotate-45 flex items-center justify-center shadow-[0_0_10px_rgba(132,204,22,0.5)]">
              <div className="-rotate-45 flex items-center justify-center w-full h-full">
                <span className="font-mono font-bold text-xl text-white">{profile.currentLevel}</span>
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-zinc-900 border border-lime-500/50 px-1.5 rounded text-[10px] text-lime-400 font-mono uppercase tracking-wider">
              LVL
            </div>
          </div>

          {/* Points Display */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="font-mono font-bold text-2xl text-white tracking-tight">
                {profile.totalPoints.toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono uppercase">XP</span>
            </div>

            {/* Progress Bar (Technical) */}
            <div className="w-32">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1">
                <span>NEXT</span>
                <span>{profile.pointsToNextLevel}</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.levelProgress}%` }}
                  className="h-full bg-gradient-to-r from-lime-500 to-emerald-400 shadow-[0_0_10px_rgba(132,204,22,0.5)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}