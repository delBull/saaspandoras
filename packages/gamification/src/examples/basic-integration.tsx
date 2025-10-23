"use client";

import {
  GamificationProvider,
  GamificationHUD,
  GamificationDashboard,
  AchievementCard,
  LeaderboardComponent,
  useGamificationContext,
  EventType,
  AchievementCategory,
  AchievementRarity
} from '../index';

// Ejemplo básico de integración
export function BasicGamificationExample({ userId }: { userId: string }) {
  return (
    <GamificationProvider userId={userId} showHUD={true}>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">🎮 Gamificación Pandora's Finance</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">🏆 Logros Disponibles</h2>
              <div className="space-y-4">
                <AchievementCard
                  achievement={{
                    id: 'first_steps',
                    name: 'Primeros Pasos',
                    description: 'Completa tu primera aplicación',
                    icon: '🚀',
                    category: AchievementCategory.PROJECTS,
                    rarity: AchievementRarity.COMMON,
                    points: 50,
                    requirements: [],
                    isActive: true,
                    isSecret: false,
                    tags: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }}
                  showProgress={true}
                />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">🏅 Tabla de Líderes</h2>
              <LeaderboardComponent
                entries={[]}
                currentUserId={userId}
                maxEntries={5}
                showUserHighlight={true}
              />
            </div>
          </div>

          <div className="mt-8">
            <GamificationActions userId={userId} />
          </div>
        </div>
      </div>
    </GamificationProvider>
  );
}

// Componente de acciones de gamificación
function GamificationActions({ userId }: { userId: string }) {
  const { trackEvent } = useGamificationContext();

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">🎮 Acciones de Gamificación</h3>
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => trackEvent(EventType.PROJECT_APPLICATION_SUBMITTED)}
          className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-black font-bold rounded-lg transition-colors"
        >
          Simular Aplicación (+50 pts)
        </button>
        <button
          onClick={() => trackEvent(EventType.DAILY_LOGIN)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
        >
          Simular Login Diario (+10 pts)
        </button>
        <button
          onClick={() => trackEvent(EventType.REFERRAL_MADE)}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition-colors"
        >
          Simular Referido (+200 pts)
        </button>
      </div>
    </div>
  );
}