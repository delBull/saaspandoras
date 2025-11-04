'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, X } from 'lucide-react';

export interface Reward {
  type: 'achievement' | 'level_up' | 'bonus';
  title: string;
  description: string;
  tokens: number;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
}

export function RewardModal({ isOpen, onClose, reward }: RewardModalProps) {
  if (!reward) return null;

  const rarityConfig = {
    common: {
      color: 'from-gray-400 to-gray-600',
      bgColor: 'from-gray-900/80 to-gray-800/80',
      borderColor: 'border-gray-500/50',
      textColor: 'text-gray-400',
      glowColor: 'shadow-gray-500/50'
    },
    uncommon: {
      color: 'from-green-400 to-emerald-500',
      bgColor: 'from-green-900/80 to-emerald-900/80',
      borderColor: 'border-green-500/50',
      textColor: 'text-green-400',
      glowColor: 'shadow-green-500/50'
    },
    rare: {
      color: 'from-blue-400 to-blue-600',
      bgColor: 'from-blue-900/80 to-blue-800/80',
      borderColor: 'border-blue-500/50',
      textColor: 'text-blue-400',
      glowColor: 'shadow-blue-500/50'
    },
    epic: {
      color: 'from-purple-400 to-purple-600',
      bgColor: 'from-purple-900/80 to-purple-800/80',
      borderColor: 'border-purple-500/50',
      textColor: 'text-purple-400',
      glowColor: 'shadow-purple-500/50'
    },
    legendary: {
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'from-yellow-900/80 to-orange-900/80',
      borderColor: 'border-yellow-500/50',
      textColor: 'text-yellow-400',
      glowColor: 'shadow-yellow-500/50'
    }
  };

  const config = rarityConfig[reward.rarity];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`relative max-w-md w-full bg-gradient-to-br ${config.bgColor} border-2 ${config.borderColor} rounded-3xl overflow-hidden shadow-2xl ${config.glowColor}`}>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Sparkle Effects */}
              <div className="absolute top-4 left-4">
                <Sparkles className={`w-8 h-8 ${config.textColor} animate-pulse`} />
              </div>
              <div className="absolute bottom-4 right-4">
                <Sparkles className={`w-6 h-6 ${config.textColor} animate-pulse`} style={{ animationDelay: '0.5s' }} />
              </div>

              {/* Header */}
              <div className="p-6 pb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex items-center justify-center mb-4"
                >
                  <div className="text-8xl animate-bounce">{reward.icon}</div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white text-center mb-2"
                >
                  {reward.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-300 text-center text-sm"
                >
                  {reward.description}
                </motion.p>
              </div>

              {/* Tokens Reward */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", bounce: 0.5 }}
                className={`mx-6 py-4 bg-gradient-to-r ${config.color.split(' ').slice(-3).join(' ').replace('from-', 'from-').replace('to-', 'to-')} rounded-xl mb-6 border border-white/10`}
              >
                <div className="flex items-center justify-center gap-3">
                  <Zap className="w-6 h-6 text-white animate-pulse" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">+{reward.tokens.toLocaleString()}</div>
                    <div className="text-sm text-white/80">Tokens Ganados</div>
                  </div>
                  <Zap className="w-6 h-6 text-white animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="p-6 pt-0 flex gap-3"
              >
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
                >
                  Continuar
                </button>
                <button
                  onClick={() => {
                    // Navigate to achievements page
                    window.location.href = '/profile/achievements';
                    onClose();
                  }}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r ${config.color} text-white rounded-xl transition-all hover:scale-105 font-medium shadow-lg ${config.glowColor}`}
                >
                  Ver Logros
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
