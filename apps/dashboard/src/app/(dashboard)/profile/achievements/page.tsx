'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import {
  Trophy,
  Star,
  Target,
  Crown,
  Medal,
  Shield,
  Award,
  ArrowLeft,
  Zap,
  Sparkles,
  Code,
  Puzzle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

import { AnimatedBackground } from "@/components/apply/AnimatedBackground";
import { useActiveAccount } from 'thirdweb/react';
import { useRealGamification } from '@/hooks/useRealGamification';

// Categories from real achievements in BD
const categoryIcons = {
  'Comunidad Activa': <Target className="w-6 h-6" />,
  'Creador Activo': <Code className="w-6 h-6" />,
  'Inversor Legendario': <Award className="w-6 h-6" />,
  'Experto Especializado': <Puzzle className="w-6 h-6" />
};

const rarityConfig = {
  first_steps: {
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-500/10 border-gray-500/30',
    textColor: 'text-gray-400',
    icon: CheckCircle,
    name: 'Principiante'
  },
  investor: {
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-500/10 border-green-500/30',
    textColor: 'text-green-400',
    icon: Star,
    name: 'Inversor'
  },
  community_builder: {
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    textColor: 'text-blue-400',
    icon: Sparkles,
    name: 'Comunidad'
  },
  early_adopter: {
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    textColor: 'text-purple-400',
    icon: Shield,
    name: 'Temprano'
  },
  high_roller: {
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    textColor: 'text-yellow-400',
    icon: Crown,
    name: 'Legendario'
  }
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AchievementsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [allAvailableAchievements, setAllAvailableAchievements] = useState<any[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);

  const account = useActiveAccount();
  const gamification = useRealGamification(account?.address ?? '');

  // Force refresh on mount to ensure fresh data
  useEffect(() => {
    if (account?.address) {
      console.log('🔄 Forcing refresh of gamification data...');
      void gamification.refreshData();
    }
  }, [account?.address, gamification.refreshData]);

  // Use the gamification hook data directly - no need for separate API call
  useEffect(() => {
    if (gamification.achievements && gamification.achievements.length > 0) {
      console.log('🎯 Using achievements from gamification hook:', gamification.achievements.length, 'items');

      // Debug: Log first few achievements with their completion status
      console.log('🔍 First 3 achievements from hook:', gamification.achievements.slice(0, 3).map((a: any) => ({
        name: a.name,
        isCompleted: a.isCompleted,
        isUnlocked: a.isUnlocked,
        progress: a.progress
      })));

      console.log('📊 Completion stats:', {
        total: gamification.achievements.length,
        unlocked: gamification.achievements.filter((a: any) => a.isCompleted).length,
        locked: gamification.achievements.filter((a: any) => !a.isCompleted).length
      });

      // Transform hook data to match expected format
      const transformedAchievements = gamification.achievements.map((achievement: any) => {
        const isUnlocked = Boolean(achievement.isCompleted || achievement.isUnlocked);
        console.log(`🔄 Transforming ${achievement.name}: isCompleted=${achievement.isCompleted}, isUnlocked=${achievement.isUnlocked} → final isUnlocked=${isUnlocked}`);

        return {
          id: achievement.achievementId || achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          type: achievement.category || achievement.type,
          pointsReward: achievement.points,
          isUnlocked: isUnlocked,
          progress: achievement.progress || 0,
          required: achievement.required || 100,
          category: achievement.category || 'general'
        };
      });

      console.log('✅ Final transformed achievements:', transformedAchievements.slice(0, 3).map(a => ({
        name: a.name,
        isUnlocked: a.isUnlocked
      })));

      setAllAvailableAchievements(transformedAchievements);
    } else {
      console.log('⚠️ No achievements from gamification hook, using empty array');
      setAllAvailableAchievements([]);
    }

    setLoadingAchievements(false);
  }, [gamification.achievements]);

  // Group achievements by real categories from BD
  const generateAchievementsByCategory = () => {
    // Group achievements by type for category organization
    const categoryGroups: Record<string, any[]> = {};

    allAvailableAchievements.forEach(achievement => {
      // Map achievement types to category names (could enhance API to include category field)
      let categoryName = 'Comunidad Activa'; // default
      if (achievement.type === 'investor') categoryName = 'Inversor Legendario';
      else if (achievement.type === 'community_builder') categoryName = 'Comunidad Activa';
      else if (achievement.type === 'early_adopter') categoryName = 'Experto Especializado';
      else if (achievement.type === 'high_roller') categoryName = 'Creador Activo';

      if (!categoryGroups[categoryName]) {
        categoryGroups[categoryName] = [];
      }
      categoryGroups[categoryName]!.push({
        ...achievement,
        category: categoryName,
        categoryName: categoryName,
        icon: achievement.icon || '🏆', // fallback
        points: achievement.pointsReward,
        pointsReward: achievement.pointsReward,
        unlocked: achievement.isUnlocked,
        isUnlocked: achievement.isUnlocked
      });
    });

    // Convert to array format expected by component
    return Object.entries(categoryGroups).map(([name, achievements]) => ({
      name,
      achievements
    }));
  };

  const achievementCategories = generateAchievementsByCategory();

  const allAchievements = achievementCategories.flatMap(cat =>
    cat.achievements.map(achievement => ({ ...achievement, categoryName: cat.name }))
  );

  const filteredAchievements = selectedCategory
    ? allAchievements.filter(a => a.category === selectedCategory)
    : allAchievements.filter(a =>
        filter === 'all' ||
        (filter === 'unlocked' && a.isUnlocked) ||
        (filter === 'locked' && !a.isUnlocked)
      );

  return (
    <div className="absolute inset-x-0 min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <AnimatedBackground />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 pb-20 md:pb-6">
        {/* Back Button - Mobile & Desktop */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Volver atrás"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >

          <div className="text-center">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6"
            >
              <Trophy className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Sistema de Logros</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                Desbloquea tu
              </span>
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Maestría en Pandora&apos;s
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto mb-8 leading-relaxed">
              Completa misiones, gana tokens y únete al exclusivo grupo de &apos;Maestros de Pandora&apos;s&apos;.
              <span className="text-yellow-400 font-semibold"> Cada logro te acerca a la grandeza digital</span>.
            </p>
          </div>
        </motion.div>

        {/* Stats Cards - DATOS REALES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12"
        >
          <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm">
            <Medal className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-yellow-400 mb-1">
              {allAvailableAchievements.filter((a: any) => a.isUnlocked).length}
            </div>
            <div className="text-sm text-zinc-400">Logros Obtenidos</div>
          </div>
          <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm">
            <Target className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-red-400 mb-1">
              {Math.max(0, allAchievements.length - allAvailableAchievements.filter((a: any) => a.isUnlocked).length)}
            </div>
            <div className="text-sm text-zinc-400">Pendientes</div>
          </div>
          <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm">
            <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {(gamification?.totalPoints || 0).toLocaleString()}
            </div>
            <div className="text-sm text-zinc-400">Tokens Ganados</div>
          </div>
          <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm">
            <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {gamification?.currentLevel || 1}
            </div>
            <div className="text-sm text-zinc-400">Tu Nivel Actual</div>
          </div>
        </motion.div>

        {/* Category Navigation - REALES categorías de BD */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12"
        >
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="h-20 flex flex-col items-center gap-2"
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-xs">Todos</span>
          </Button>

          {Object.entries(categoryIcons).map(([categoryName, icon]) => (
            <Button
              key={categoryName}
              variant={selectedCategory === categoryName ? "default" : "outline"}
              onClick={() => setSelectedCategory(categoryName)}
              className="h-20 flex flex-col items-center gap-2 relative"
            >
              {icon}
              <span className="text-xs text-center">{categoryName}</span>
            </Button>
          ))}
        </motion.div>

        {/* Achievements Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {filteredAchievements.map((achievement, index) => {
            const rarity = rarityConfig[achievement.type as keyof typeof rarityConfig];
            if (!rarity) return null;
            const RarityIconComponent = rarity.icon;

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="group"
              >
                <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 border-2 ${
                  achievement.isUnlocked
                    ? 'border-yellow-500 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 shadow-lg shadow-yellow-500/10'
                    : `${rarity.bgColor} opacity-80 hover:opacity-100`
                } backdrop-blur-sm`}>
                  {/* Rarity Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    achievement.isUnlocked
                      ? 'bg-yellow-500 text-black shadow-lg'
                      : `bg-gradient-to-r ${rarity.color} text-white`
                  }`}>
                    <RarityIconComponent className="w-3 h-3" />
                    <span>{rarity.name}</span>
                  </div>

                  {/* Glow Effect for Completed */}
                  {achievement.isUnlocked && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 pointer-events-none" />
                  )}

                  <CardHeader className="text-center pt-8">
                    <div className="text-5xl mb-4 relative">
                      <div className={`absolute inset-0 ${
                        achievement.isUnlocked
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-xl opacity-30'
                          : ''
                      }`}></div>
                      <div className="relative">{achievement.icon}</div>
                    </div>

                    <CardTitle className="text-white text-xl mb-2 group-hover:text-yellow-400 transition-colors">
                      {achievement.name}
                    </CardTitle>
                    <CardDescription className="text-gray-300 text-sm">
                      {achievement.description}
                    </CardDescription>

                    {/* Category Badge */}
                    <div className="inline-flex items-center gap-1 px-3 py-1 mt-3 bg-zinc-800/50 border border-zinc-700 rounded-full text-xs">
                      <span className="text-zinc-400 capitalize">{achievement.category}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar for Incomplete Achievements */}
                    {!achievement.isUnlocked && achievement.progress !== undefined && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Progreso</span>
                          <span className="text-white font-medium">{achievement.progress ?? 0}/{achievement.required ?? 0}</span>
                        </div>
                        <div className="w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 h-full transition-all duration-1000 ease-out rounded-full"
                            style={{ width: `${Math.min((achievement.progress ?? 0) / (achievement.required ?? 1) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-center text-xs text-gray-500">
                          {(achievement.required ?? 0) - (achievement.progress ?? 0) > 0
                            ? `Quedan ${(achievement.required ?? 0) - (achievement.progress ?? 0)} para completar`
                            : '¡Ya casi lo tienes!'
                          }
                        </div>
                      </div>
                    )}

                    {/* Points Display */}
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span className={`font-bold ${
                          achievement.isUnlocked ? 'text-yellow-400' : 'text-gray-500'
                        }`}>
                          +{achievement.pointsReward} tokens
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        achievement.isUnlocked
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg'
                          : 'bg-zinc-700/50 text-gray-400'
                      }`}>
                        {achievement.isUnlocked ? '🏆 Completado' : '⏳ Pendiente'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* No Results Message */}
        {filteredAchievements.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay logros en esta categoría</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Intenta con otra categoría o filtro para encontrar logros disponibles.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
