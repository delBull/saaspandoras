'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import {
  Trophy,
  Medal,
  Crown,
  Zap,
  TrendingUp,
  Target,
  Award,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatedBackground } from "@/components/apply/AnimatedBackground";

// Component for user avatars using real profile images when available
function UserAvatar({ userId, size = 12 }: { userId: string; size?: number }) {
  const [userProfile, setUserProfile] = useState<{ image?: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        // Fetch minimal user profile data for avatar
        const response = await fetch('/api/profile', {
          headers: {
            'x-wallet-address': userId,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setUserProfile({
            image: profile.image,
            name: profile.name
          });
        }
      } catch (error) {
        console.warn('Failed to fetch user profile for avatar:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchUserProfile();
  }, [userId]);

  // Generate a consistent color based on wallet address for fallback
  const getColorFromWallet = (address: string) => {
    const colors = [
      'from-yellow-400 to-orange-500',
      'from-blue-400 to-purple-500',
      'from-green-400 to-emerald-500',
      'from-pink-400 to-rose-500',
      'from-indigo-400 to-blue-500',
      'from-red-400 to-pink-500',
      'from-purple-400 to-indigo-500',
      'from-cyan-400 to-blue-500'
    ];
    const hash = address.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const displayText = userId ? `${userId.slice(0, 4)}...${userId.slice(-2)}` : '??';

  // Show real profile image if available
  if (userProfile?.image && !loading) {
    return (
      <div className={`w-${size} h-${size} rounded-lg border-2 border-white/20 overflow-hidden`}>
        <Image
          src={userProfile.image}
          alt={userProfile.name || 'User avatar'}
          width={size * 4} // Convert Tailwind size to pixels
          height={size * 4}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to generated avatar on image load error
            const target = e.target as HTMLElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="w-full h-full rounded-lg bg-gradient-to-br ${getColorFromWallet(userId)} flex items-center justify-center font-mono text-white font-bold text-xs">${displayText}</div>`;
            }
          }}
        />
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className={`w-${size} h-${size} rounded-lg border-2 border-white/20 bg-gray-700 animate-pulse flex items-center justify-center`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      </div>
    );
  }

  // Fallback to generated avatar
  return (
    <div className={`w-${size} h-${size} rounded-lg border-2 border-white/20 bg-gradient-to-br ${getColorFromWallet(userId)} flex items-center justify-center font-mono text-white font-bold text-xs overflow-hidden`}>
      {displayText}
    </div>
  );
}

// Interface for API response direct from service
interface LeaderboardApiResponse {
  leaderboard: {
    id: string;
    userId: string;
    walletAddress: string;
    points: number;
    totalPoints: number;
    currentLevel: number;
    rank: number;
    // other fields...
  }[];
  success: boolean;
  message: string;
}

// Interface for leaderboard display data
interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  displayName: string;
  totalPoints: number;
  achievementsUnlocked: number;
  level: number;
  currentLevel: number;
  recentActivity: string;
  badge: string;
  streak: number;
  trending: string;
  isSandboxPioneer?: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-6 h-6 text-yellow-400" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />;
    case 3:
      return <Award className="w-6 h-6 text-amber-600" />;
    default:
      return <span className="text-2xl font-bold text-gray-600">#{rank}</span>;
  }
};

const getBadgeColor = (badge: string) => {
  switch (badge) {
    case 'Gold':
      return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black';
    case 'Silver':
      return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    case 'Bronze':
      return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
    case 'Sandbox':
      return 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]';
    default:
      return 'bg-gradient-to-r from-blue-400 to-purple-500 text-white';
  }
};

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<'points' | 'achievements' | 'level'>('points');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    console.log('🏆 LEADERBOARD: useEffect triggered, loading data...');

    const loadLeaderboard = async () => {
      try {
        console.log('🏆 LEADERBOARD: Making API call to /api/gamification/leaderboard/points');
        // Use the correct leaderboard API
        const response = await fetch('/api/gamification/leaderboard/points?limit=20');
        console.log('🏆 LEADERBOARD: API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          const data = result.leaderboard ?? [];
          console.log('🔍 DEBUG - Raw API response:', result);
          console.log('🔍 DEBUG - Leaderboard data array:', data);
          console.log('🔍 DEBUG - First user data:', data[0]);

          // Simple transformation without achievements fetching
          const transformedData = data.map((user: any, index: number): LeaderboardUser => {
            const walletAddress = user.walletAddress ?? user.userId ?? user.user_id ?? `user_${index}`;

            return {
              rank: user.rank ?? index + 1,
              userId: walletAddress,
              displayName: user.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 'Usuario',
              name: user.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 'Usuario',
              totalPoints: user.points ?? user.totalPoints ?? user.total_points ?? 0,
              currentLevel: user.currentLevel ?? user.level ?? 1,
              achievementsUnlocked: 0, // Simplified
              level: user.currentLevel ?? user.level ?? 1,
              badge: user.points > 1000 ? 'Gold' : user.points > 500 ? 'Silver' : 'Rising',
              streak: user.currentStreak ?? 0,
              recentActivity: 'Hoy',
              trending: 'stable',
              isSandboxPioneer: (user.points % 10 === 0) // Mock logic: if points end in 0, they tested sandbox
            };
          });

          console.log('🏆 LEADERBOARD: Setting leaderboard data:', transformedData.length, 'users');
          setLeaderboardData(transformedData);
          console.log('✅ Loaded leaderboard data:', data.length, 'users');
        } else {
          console.log('ℹ️ No leaderboard data found (empty leaderboard)');
          setLeaderboardData([]);
        }
      } catch (error) {
        console.error('❌ Error loading leaderboard:', error);
        // Set empty array to trigger error state in UI
        setLeaderboardData([]);
      }
    };

    void loadLeaderboard();
  }, []);

  const sortedData = useMemo(() => {
    return [...leaderboardData].sort((a, b) => {
      if (sortBy === 'points') return b.totalPoints - a.totalPoints;
      if (sortBy === 'achievements') return 0;
      if (sortBy === 'level') return b.currentLevel - a.currentLevel;
      return 0;
    });
  }, [sortBy, leaderboardData]);

  const topThree = sortedData.slice(0, 3);

  const sortOptions = [
    { key: 'points' as const, label: 'Por Tokens', icon: Zap }
  ];

  return (
    <div className="absolute inset-x-0 min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <AnimatedBackground />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 pb-20 md:pb-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link href="/profile/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al dashboard
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6"
            >
              <Trophy className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Leaderboard</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                Ranking de
              </span>
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Maestros Pandora&apos;s
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto mb-8 leading-relaxed">
              Descubre quiénes son los usuarios más activos y exitosos en la plataforma.
              <span className="text-yellow-400 font-semibold"> ¡Únete a la competición!</span>
            </p>
          </div>
        </motion.div>

        {/* Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {/* Second Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="order-2 md:order-1"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/50 backdrop-blur-sm">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-sm font-medium text-yellow-400 mb-4">
                  🥈 2do Lugar
                </div>

                <div className="flex justify-center mb-4">
                  <UserAvatar userId={topThree[1]?.userId || ''} size={20} />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{topThree[1]?.name ?? 'Usuario'}</h3>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{(topThree[1]?.totalPoints ?? 0).toLocaleString()} tokens</span>
                </div>
                {/* Removed level and achievements text */}
              </CardContent>
            </Card>
          </motion.div>

          {/* First Place */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="order-1 md:order-2"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 border border-yellow-400/60 backdrop-blur-sm">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-300 to-yellow-500"></div>
              <Crown className="w-8 h-8 text-yellow-400 absolute top-4 right-4" />
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-sm font-medium text-yellow-400 mb-4">
                  🥇 1er Lugar
                </div>

                <div className="flex justify-center mb-4">
                  <UserAvatar userId={topThree[0]?.userId || ''} size={24} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{topThree[0]?.name ?? 'Usuario'}</h3>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-lg">{(topThree[0]?.totalPoints ?? 0).toLocaleString()} tokens</span>
                </div>
                {/* Removed level and achievements text */}
              </CardContent>
            </Card>
          </motion.div>

          {/* Third Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="order-3"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/50 backdrop-blur-sm">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-sm font-medium text-amber-400 mb-4">
                  🥉 3er Lugar
                </div>

                <div className="flex justify-center mb-4">
                  <UserAvatar userId={topThree[2]?.userId || ''} size={20} />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{topThree[2]?.name ?? 'Usuario'}</h3>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-semibold">{(topThree[2]?.totalPoints ?? 0).toLocaleString()} tokens</span>
                </div>
                {/* Removed level and achievements text */}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Sort Options */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {sortOptions.map((sort) => {
            const IconComponent = sort.icon;
            return (
              <Button
                key={sort.key}
                variant={sortBy === sort.key ? 'default' : 'outline'}
                onClick={() => setSortBy(sort.key)}
                className="flex items-center gap-2"
              >
                <IconComponent className="w-4 h-4" />
                {sort.label}
              </Button>
            );
          })}
        </motion.div>

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                Ranking Completo
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Los mejores usuarios de la plataforma ordenados por tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-700/50 to-gray-600/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">Leaderboard Vacío</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Aún no hay usuarios con actividades de gamificación.
                      ¡Conecta una wallet y participa para ser el primero en el ranking!
                    </p>
                    <div className="text-sm text-gray-500">
                      Los usuarios aparecerán aquí cuando acumulan tokens por acciones como:
                    </div>
                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                      • Primer login (+10 tokens)
                      • Enviar aplicaciones (+50 tokens)
                      • Proyectos aprobados (+100 tokens)
                      • Referencias exitosas (+200 tokens)
                    </div>
                  </div>
                ) : (
                  sortedData.map((user, index) => (
                    <motion.div
                      key={user.userId}
                      initial={{ opacity: 0, x: index < 3 ? 0 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.3 + index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] ${index < 3
                          ? `bg-gradient-to-r ${user.rank === 1 ? 'from-yellow-900/20 to-yellow-800/20 border border-yellow-500/30' :
                            user.rank === 2 ? 'from-gray-700/20 to-gray-600/20 border border-gray-500/30' :
                              'from-amber-900/20 to-orange-900/20 border border-amber-500/30'}`
                          : 'bg-zinc-800/30 border border-zinc-700/50'
                        }`}
                    >
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 flex justify-center">
                        {getRankIcon(user.rank)}
                      </div>

                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <UserAvatar userId={user.userId} size={12} />
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-sm md:text-lg truncate">{user.displayName}</h3>
                          <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs ${getBadgeColor(user.badge)}`}>
                            {user.badge}
                          </span>
                          {user.isSandboxPioneer && (
                            <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${getBadgeColor('Sandbox')}`}>
                              Sandbox
                            </span>
                          )}
                        </div>
                        {/* Removed level and achievements info */}
                      </div>

                      {/* Points */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                          <Zap className="w-5 h-5" />
                          {(user.totalPoints ?? 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">tokens</div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Quieres ser el
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"> próximo Ma&icirc;tre</span>?
            </h2>

            <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
              ¡Actúa ahora! Gana tu primera aplicación de creación y comienza a acumular tokens y logros.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/applicants">
                <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 hover:scale-105">
                  Explorar Protocolos Disponibles
                </Button>
              </Link>

              <Link href="/apply">
                <Button variant="outline" className="bg-zinc-800/50 border-zinc-600 text-zinc-300 hover:bg-zinc-700/50 px-8 py-3 rounded-xl">
                  Desatar tu propia Creación
                </Button>
              </Link>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
