'use client';

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
  Users,
  ArrowLeft,
  Zap,
  Sparkles,
  Rocket,
  Code,
  Puzzle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

import { AnimatedBackground } from "@/components/apply/AnimatedBackground";

import { useActiveAccount } from 'thirdweb/react';

// Hook para connectar con data real de gamification
import { useRealGamification } from '@/hooks/useRealGamification';

// Removiendo tipo no usado

// Achievement templates - solo para mostrar disponible achievements, sin data hardcodeada
const achievementTemplates = [
  {
    icon: <Target className="w-6 h-6" />,
    title: "Comunidad Activa",
    achievements: [
      {
        id: 'daily_login',
        name: 'Primer Login',
        description: 'Conecta tu wallet exitosamente',
        icon: '🔗',
        rarity: 'common',
        points: 10,
        category: 'login',
        eventType: 'DAILY_LOGIN'
      },
      {
        id: '2',
        name: 'Explorador Intrépido',
        description: 'Ve 5 creaciones diferentes',
        icon: '🔍',
        rarity: 'common',
        points: 25,
        category: 'exploration',
        eventType: 'VIEW_PROJECTS_5'
      },
      {
        id: '3',
        name: 'Curioso Universal',
        description: 'Has explorado 25 creaciones únicas',
        icon: '🌍',
        rarity: 'rare',
        points: 150,
        unlocked: false,
        progress: 12,
        required: 25,
        category: 'exploration'
      },
      {
        id: '4',
        name: 'Maestro Explorador',
        description: 'Has visto 100 creaciones diferentes',
        icon: '🗺️',
        rarity: 'legendary',
        points: 1000,
        unlocked: false,
        progress: 12,
        required: 100,
        category: 'exploration'
      }
    ]
  },
  {
    icon: <Code className="w-6 h-6" />,
    title: "Creador Activo",
    achievements: [
      {
        id: '5',
        name: 'Primer Borrador',
        description: 'Has creado tu primera creación',
        icon: '📝',
        rarity: 'common',
        points: 50,
        unlocked: false,
        progress: 0,
        required: 1,
        category: 'creation'
      },
      {
        id: '6',
        name: 'Aplicante Proactivo',
        description: 'Has enviado tu primera aplicación completa',
        icon: '📤',
        rarity: 'uncommon',
        points: 100,
        unlocked: false,
        progress: 0,
        required: 1,
        category: 'creation'
      },
      {
        id: '7',
        name: 'Veterano de Proyectos',
        description: 'Has tenido 5 aplicaciones aprobadas',
        icon: '🎖️',
        rarity: 'epic',
        points: 500,
        unlocked: false,
        progress: 0,
        required: 5,
        category: 'creation'
      },
      {
        id: '8',
        name: 'Maestro Constructor',
        description: 'Has completado 20 proyectos exitosos',
        icon: '🏗️',
        rarity: 'legendary',
        points: 2000,
        unlocked: false,
        progress: 0,
        required: 20,
        category: 'creation'
      }
    ]
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Inversor Legendario",
    achievements: [
      {
        id: '9',
        name: 'Primer Paso',
        description: 'Has invertido en tu primera creación',
        icon: '💰',
        rarity: 'uncommon',
        points: 75,
        unlocked: false,
        progress: 0,
        required: 1,
        category: 'investment'
      },
      {
        id: '10',
        name: 'Visionario Temprano',
        description: 'Has invertido en 10 creaciones distintas',
        icon: '👁️',
        rarity: 'rare',
        points: 300,
        unlocked: false,
        progress: 0,
        required: 10,
        category: 'investment'
      },
      {
        id: '11',
        name: 'Ballena Magnífica',
        description: 'Has invertido más de 100 ETH total',
        icon: '🐋',
        rarity: 'legendary',
        points: 5000,
        unlocked: false,
        progress: 0,
        required: 100,
        category: 'investment'
      }
    ]
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Líder de Comunidad",
    achievements: [
      {
        id: '12',
        name: 'Embajador Novato',
        description: 'Has referido a tu primer amigo',
        icon: '👥',
        rarity: 'common',
        points: 50,
        unlocked: false,
        progress: 0,
        required: 1,
        category: 'referral'
      },
      {
        id: '13',
        name: 'Influencer Emergente',
        description: 'Has referido a 25 miembros',
        icon: '📢',
        rarity: 'epic',
        points: 750,
        unlocked: false,
        progress: 3,
        required: 25,
        category: 'referral'
      },
      {
        id: '14',
        name: 'Emperador de la Comunidad',
        description: 'Has construido una red de 100+ miembros',
        icon: '👑',
        rarity: 'legendary',
        points: 10000,
        unlocked: false,
        progress: 3,
        required: 100,
        category: 'referral'
      }
    ]
  },
  {
    icon: <Puzzle className="w-6 h-6" />,
    title: "Experto Especializado",
    achievements: [
      {
        id: '15',
        name: 'Escritor Técnico',
        description: 'Has contribuido con documentación detallada',
        icon: '📚',
        rarity: 'rare',
        points: 200,
        unlocked: false,
        progress: 0,
        required: 1,
        category: 'expertise'
      },
      {
        id: '16',
        name: 'Validador Experto',
        description: 'Has realizado 100+ validaciones de proyectos',
        icon: '✅',
        rarity: 'epic',
        points: 600,
        unlocked: false,
        progress: 0,
        required: 100,
        category: 'expertise'
      }
    ]
  }
];

const rarityConfig = {
  common: {
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-500/10 border-gray-500/30',
    textColor: 'text-gray-400',
    icon: CheckCircle,
    name: 'Común'
  },
  uncommon: {
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-500/10 border-green-500/30',
    textColor: 'text-green-400',
    icon: Star,
    name: 'Poco Común'
  },
  rare: {
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    textColor: 'text-blue-400',
    icon: Sparkles,
    name: 'Raro'
  },
  epic: {
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    textColor: 'text-purple-400',
    icon: Shield,
    name: 'Épico'
  },
  legendary: {
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    textColor: 'text-yellow-400',
    icon: Crown,
    name: 'Legendario'
  }
};

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // 🎮 CONECTAR CON EL SYSTEMA REAL - Necesitamos obtener la wallet del usuario
  const account = useActiveAccount();
  const gamification = useRealGamification(account?.address ?? '');

  // 🔄 COMBINAR TEMPLATES CON DATA REAL - TYPESCRIPT SAFE
  const generateAchievementsFromData = () => {
    // Asegurar que siempre tengamos un array (puede venir como null/undefined mientras carga)
    const completedAchievements = Array.isArray(gamification?.achievements)
      ? gamification.achievements
      : [];

    return achievementTemplates.map(category => ({
      ...category,
      achievements: category.achievements.map(achievement => {
        /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
        const completedAchievement = completedAchievements.find(
          (ca: any) => ca.id === achievement.id || ca.eventType === achievement.eventType
        );

        return {
          ...achievement,
          unlocked: !!completedAchievement,
          // unlockedAt: completedAchievement?.unlockedAt, // Propiedad no existe en UserAchievement type
          categoryName: category.title,
          currentProgress: completedAchievement?.progress ?? 0
        };
        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
      })
    }));
  };

  const achievementCategories = generateAchievementsFromData();

  const allAchievements = achievementCategories.flatMap(cat =>
    cat.achievements.map(achievement => ({ ...achievement, categoryName: cat.title }))
  );

  const filteredAchievements = selectedCategory
    ? allAchievements.filter(a => a.category === selectedCategory.split('-')[1])
    : allAchievements.filter(a =>
        filter === 'all' ||
        (filter === 'unlocked' && a.unlocked) ||
        (filter === 'locked' && !a.unlocked)
      );

  const stats = {
    total: allAchievements.length,
    unlocked: allAchievements.filter(a => a.unlocked).length,
    totalPoints: Math.max(
      allAchievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0),
      gamification?.totalPoints || 0
    )
  };

  // Debug logging para development
  useEffect(() => {
    if (gamification?.achievements) {
      console.log('🎮 Achievements page loaded:', gamification.achievements.length, 'achievements');
    }
  }, [gamification?.achievements]);

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
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al perfil
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

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12"
        >
          <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm">
            <Medal className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.unlocked}</div>
            <div className="text-sm text-zinc-400">Logros Obtenidos</div>
          </div>
          <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm">
            <Target className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-red-400 mb-1">{stats.total - stats.unlocked}</div>
            <div className="text-sm text-zinc-400">Pendientes</div>
          </div>
          <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm">
            <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-400 mb-1">{stats.totalPoints.toLocaleString()}</div>
            <div className="text-sm text-zinc-400">Tokens Ganados</div>
          </div>
          <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm">
            <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-400 mb-1">{Math.round((stats.unlocked / stats.total) * 100)}%</div>
            <div className="text-sm text-zinc-400">Progreso Total</div>
          </div>
        </motion.div>

        {/* Category Navigation */}
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

          {achievementCategories.map((cat, index) => (
            <Button
              key={cat.title}
              variant={selectedCategory === `cat-${index}` ? "default" : "outline"}
              onClick={() => setSelectedCategory(`cat-${index}`)}
              className="h-20 flex flex-col items-center gap-2 relative"
            >
              {cat.icon}
              <span className="text-xs text-center">{cat.title}</span>
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
            const rarity = rarityConfig[achievement.rarity as keyof typeof rarityConfig];
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
                  achievement.unlocked
                    ? 'border-yellow-500 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 shadow-lg shadow-yellow-500/10'
                    : `${rarity.bgColor} opacity-80 hover:opacity-100`
                } backdrop-blur-sm`}>
                  {/* Rarity Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    achievement.unlocked
                      ? 'bg-yellow-500 text-black shadow-lg'
                      : `bg-gradient-to-r ${rarity.color} text-white`
                  }`}>
                    <RarityIconComponent className="w-3 h-3" />
                    <span>{rarity.name}</span>
                  </div>

                  {/* Glow Effect for Completed */}
                  {achievement.unlocked && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 pointer-events-none" />
                  )}

                  <CardHeader className="text-center pt-8">
                    <div className="text-5xl mb-4 relative">
                      <div className={`absolute inset-0 ${
                        achievement.unlocked
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
                      <span className="text-zinc-400 capitalize">{achievement.categoryName}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar for Incomplete Achievements */}
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Progreso</span>
                          <span className="text-white font-medium">{achievement.progress}/{achievement.required}</span>
                        </div>
                        <div className="w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 h-full transition-all duration-1000 ease-out rounded-full"
                            style={{ width: `${Math.min((achievement.progress / achievement.required) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-center text-xs text-gray-500">
                          {achievement.required - achievement.progress > 0
                            ? `Quedan ${achievement.required - achievement.progress} para completar`
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
                          achievement.unlocked ? 'text-yellow-400' : 'text-gray-500'
                        }`}>
                          +{achievement.points} tokens
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        achievement.unlocked
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg'
                          : 'bg-zinc-700/50 text-gray-400'
                      }`}>
                        {achievement.unlocked ? '🏆 Completado' : '⏳ Pendiente'}
                      </div>
                    </div>

                    {/* Unlock Date for Completed Achievements */}
                    {achievement.unlocked && false && achievement.unlockedAt && (
                      <div className="text-center pt-2 border-t border-zinc-700/50">
                        <div className="text-xs text-gray-500">
                          {/* Fecha de desbloqueo no disponible en este template */}
                          Completado recientemente
                        </div>
                      </div>
                    )}
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

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Listo para alcanzar la
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"> cima de los Maestros</span>?
            </h2>

            <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
              Cada acción en Pandora&apos;s te acerca a logros legendarios y recompensas exclusivas.
              Tu viaje hacia la maestría digital acaba de comenzar.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 hover:scale-105"
              >
                <Link href="/applicants" className="flex items-center gap-2">
                  Explorar Creaciones
                  <Sparkles className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                variant="outline"
                className="bg-zinc-800/50 border-zinc-600 text-zinc-300 hover:bg-zinc-700/50 px-8 py-3 rounded-xl"
              >
                <Link href="/apply" className="flex items-center gap-2">
                  Desatar tu propia Creación
                  <Rocket className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-zinc-500">
              💡 <strong>Próximo desafío:</strong> Crea tu primer artefacto o comunidad y gana +50 tokens
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
