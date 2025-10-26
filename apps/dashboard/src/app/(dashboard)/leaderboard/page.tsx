'use client';

import React, { useState, useMemo } from 'react';
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
import { AnimatedBackground } from "@/components/apply/AnimatedBackground";

// Fake leaderboard data - mock for now
const mockLeaderboardData = [
  {
    rank: 1,
    userId: '0x123456789',
    name: 'Alex Master',
    avatar: '/images/avatars/master.png',
    totalPoints: 12500,
    achievementsUnlocked: 15,
    level: 8,
    recentActivity: '3hrs ago',
    badge: 'Gold',
    streak: 12,
    trending: 'up'
  },
  {
    rank: 2,
    userId: '0x987654321',
    name: 'Sarah Elite',
    avatar: '/images/avatars/elite.png',
    totalPoints: 11200,
    achievementsUnlocked: 13,
    level: 7,
    recentActivity: '1hr ago',
    badge: 'Silver',
    streak: 8,
    trending: 'up'
  },
  {
    rank: 3,
    userId: '0x456789123',
    name: 'Mike Prodigy',
    avatar: '/images/avatars/prodigy.png',
    totalPoints: 10800,
    achievementsUnlocked: 12,
    level: 7,
    recentActivity: '2hrs ago',
    badge: 'Bronze',
    streak: 5,
    trending: 'down'
  },
  {
    rank: 4,
    userId: '0x789123456',
    name: 'Emma Pioneer',
    avatar: '/images/avatars/pioneer.png',
    totalPoints: 9500,
    achievementsUnlocked: 11,
    level: 6,
    recentActivity: '30min ago',
    badge: 'Rising',
    streak: 3,
    trending: 'up'
  },
  {
    rank: 5,
    userId: '0x321654987',
    name: 'João Innovation',
    avatar: '/images/avatars/innovation.png',
    totalPoints: 8900,
    achievementsUnlocked: 10,
    level: 6,
    recentActivity: '1hr ago',
    badge: 'Rising',
    streak: 1,
    trending: 'stable'
  }
];

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
    default:
      return 'bg-gradient-to-r from-blue-400 to-purple-500 text-white';
  }
};

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<'points' | 'achievements' | 'level'>('points');

  const sortedData = useMemo(() => {
    return [...mockLeaderboardData].sort((a, b) => {
      if (sortBy === 'points') return b.totalPoints - a.totalPoints;
      if (sortBy === 'achievements') return b.achievementsUnlocked - a.achievementsUnlocked;
      if (sortBy === 'level') return b.level - a.level;
      return 0;
    }).map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  }, [sortBy]);

  const topThree = sortedData.slice(0, 3);

  return (
    <div className="absolute inset-x-0 min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <AnimatedBackground />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
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
          {/* First Place */}
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
                  🥇 2do Lugar
                </div>

                <div className="w-20 h-20 mx-auto mb-4 border-4 border-yellow-500 shadow-lg bg-gray-700 rounded-full flex items-center justify-center font-bold text-xl text-white">
                  {topThree[1]?.name?.charAt(0).toUpperCase()}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{topThree[1]?.name}</h3>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{topThree[1]?.totalPoints.toLocaleString()} tokens</span>
                </div>
                <div className="text-sm text-gray-400">Nivel {topThree[1]?.level} • {topThree[1]?.achievementsUnlocked} logros</div>
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

                <div className="w-24 h-24 mx-auto mb-4 border-4 border-yellow-400 shadow-lg bg-gray-700 rounded-full flex items-center justify-center font-bold text-2xl text-white">
                  {topThree[0]?.name?.charAt(0).toUpperCase()}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{topThree[0]?.name}</h3>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-lg">{topThree[0]?.totalPoints.toLocaleString()} tokens</span>
                </div>
                <div className="text-sm text-gray-400">Nivel {topThree[0]?.level} • {topThree[0]?.achievementsUnlocked} logros</div>
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

                <div className="w-20 h-20 mx-auto mb-4 border-4 border-amber-500 shadow-lg bg-gray-700 rounded-full flex items-center justify-center font-bold text-xl text-white">
                  {topThree[2]?.name?.charAt(0).toUpperCase()}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{topThree[2]?.name}</h3>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-semibold">{topThree[2]?.totalPoints.toLocaleString()} tokens</span>
                </div>
                <div className="text-sm text-gray-400">Nivel {topThree[2]?.level} • {topThree[2]?.achievementsUnlocked} logros</div>
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
          {[
            { key: 'points' as const, label: 'Por Tokens', icon: Zap },
            { key: 'achievements' as const, label: 'Por Logros', icon: Award },
            { key: 'level' as const, label: 'Por Nivel', icon: Target }
          ].map((sort) => {
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
                Los mejores usuarios de la plataforma ordenados por {sortBy === 'points' ? 'tokens' : sortBy === 'achievements' ? 'logros' : 'nivel'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedData.map((user, index) => (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, x: index < 3 ? 0 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 + index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] ${
                      index < 3
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
                      <div className="w-12 h-12 rounded-full border-2 border-gray-600 bg-gray-700 flex items-center justify-center font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-lg truncate">{user.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getBadgeColor(user.badge)}`}>
                          {user.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Nivel {user.level}</span>
                        <span>{user.achievementsUnlocked} logros</span>
                        <span>Streak: {user.streak} días</span>
                        <span>Activo {user.recentActivity}</span>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                        <Zap className="w-5 h-5" />
                        {user.totalPoints.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">tokens</div>
                    </div>
                  </motion.div>
                ))}
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
                Explorar Creaciones Disponibles
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
