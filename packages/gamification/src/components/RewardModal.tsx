"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Gift, Star, Zap, Crown, X } from "lucide-react";
import { Reward, RewardRarity } from '../types';
import { cn } from "../utils/cn";

interface RewardModalProps {
  reward: Reward | null;
  isOpen: boolean;
  onClose: () => void;
  onClaim?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function RewardModal({
  reward,
  isOpen,
  onClose,
  onClaim,
  isLoading = false,
  className
}: RewardModalProps) {
  if (!reward || !isOpen) return null;

  const rarityColors = {
    common: 'from-gray-500 to-gray-600 border-gray-500/30',
    uncommon: 'from-blue-500 to-blue-600 border-blue-500/30',
    rare: 'from-purple-500 to-purple-600 border-purple-500/30',
    epic: 'from-yellow-500 to-orange-500 border-yellow-500/30',
    legendary: 'from-red-500 via-pink-500 to-purple-500 border-red-500/30'
  };

  const rarityGlow = {
    common: 'shadow-gray-500/20',
    uncommon: 'shadow-blue-500/20',
    rare: 'shadow-purple-500/20',
    epic: 'shadow-yellow-500/20',
    legendary: 'shadow-red-500/20'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className={cn(
            "relative max-w-md w-full bg-gradient-to-br border rounded-2xl shadow-2xl overflow-hidden",
            `bg-gradient-to-br ${rarityColors[reward.rarity]}`,
            rarityGlow[reward.rarity],
            className
          )}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span className="text-4xl">{reward.icon}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-3">
                <Star className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium text-white uppercase">
                  {reward.rarity}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {reward.name}
              </h2>

              <p className="text-zinc-200 mb-4">
                {reward.description}
              </p>
            </motion.div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/20 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-lime-400">{reward.value}</div>
                  <div className="text-zinc-300">Valor</div>
                </div>
                <div className="w-px h-8 bg-zinc-600" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{reward.requiredLevel}</div>
                  <div className="text-zinc-300">Nivel req.</div>
                </div>
                <div className="w-px h-8 bg-zinc-600" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{reward.requiredPoints}</div>
                  <div className="text-zinc-300">Puntos req.</div>
                </div>
              </div>
            </motion.div>

            {/* Requirements */}
            {reward.requiredAchievements && reward.requiredAchievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <h4 className="font-bold text-white mb-2">Requisitos de Logros:</h4>
                <div className="space-y-2">
                  {reward.requiredAchievements.map((achievementId, index) => (
                    <div key={achievementId} className="flex items-center gap-2 text-sm text-zinc-300">
                      <div className="w-2 h-2 bg-lime-400 rounded-full" />
                      <span>Logro #{achievementId}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Claim Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={onClaim}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Reclamar Recompensa
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -top-4 -left-4 w-8 h-8 bg-white/10 rounded-full"
          />

          <motion.div
            animate={{
              rotate: -360,
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
            }}
            className="absolute -bottom-4 -right-4 w-6 h-6 bg-white/10 rounded-full"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
