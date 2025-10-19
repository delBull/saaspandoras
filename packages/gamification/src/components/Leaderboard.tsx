"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { LeaderboardEntry } from '../types';
import { cn } from "@saasfly/ui";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  maxEntries?: number;
  showUserHighlight?: boolean;
  className?: string;
}

export function Leaderboard({
  entries,
  currentUserId,
  maxEntries = 10,
  showUserHighlight = true,
  className
}: LeaderboardProps) {
  const displayEntries = entries.slice(0, maxEntries);
  const userEntry = entries.find(entry => entry.userId === currentUserId);
  const userRank = userEntry?.rank || 0;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-zinc-400">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-500/10 to-slate-500/10 border-gray-500/30";
      case 3:
        return "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30";
      default:
        return "bg-zinc-900/50 border-zinc-700/50";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-zinc-900/30 border border-zinc-800 rounded-xl p-6", className)}
    >
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-lime-400" />
        <h3 className="text-xl font-bold text-white">Tabla de Líderes</h3>
      </div>

      <div className="space-y-3">
        {displayEntries.map((entry, index) => {
          const isCurrentUser = showUserHighlight && entry.userId === currentUserId;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-all duration-200",
                getRankStyle(entry.rank),
                isCurrentUser && "ring-2 ring-lime-500/50 bg-lime-500/5"
              )}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-10">
                {getRankIcon(entry.rank)}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-lime-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  {entry.userName?.charAt(0).toUpperCase() || entry.walletAddress.charAt(2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">
                      {entry.userName || `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`}
                    </span>
                    {isCurrentUser && (
                      <span className="px-2 py-1 bg-lime-500/20 text-lime-400 text-xs rounded-full">
                        Tú
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-400">
                    Nivel {entry.currentLevel} • {entry.totalPoints.toLocaleString()} pts
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-zinc-300">{entry.projectsApplied}</div>
                  <div className="text-zinc-500">Proyectos</div>
                </div>
                <div className="text-center">
                  <div className="text-zinc-300">{entry.achievementsUnlocked}</div>
                  <div className="text-zinc-500">Logros</div>
                </div>
                <div className="text-center">
                  <div className="text-zinc-300">{entry.communityContributions}</div>
                  <div className="text-zinc-500">Contribuciones</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* User Rank Summary */}
      {showUserHighlight && userEntry && userRank > maxEntries && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-lime-500/10 border border-lime-500/30 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              #{userRank}
            </div>
            <div className="flex-1">
              <div className="text-sm text-lime-300">Tu posición actual</div>
              <div className="text-xs text-zinc-400">
                Estás en el top {Math.round((userRank / entries.length) * 100)}% de usuarios
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}