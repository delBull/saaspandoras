"use client";

import {
  GamificationProvider,
  GamificationHUD,
  GamificationDashboard,
  AchievementCard,
  LeaderboardComponent,
  useGamificationContext,
  AchievementCategory,
  AchievementRarity,
  UserAchievement
} from '../index';

// Ejemplo de integración simple en el dashboard actual
export function SimpleGamificationIntegration({ userId }: { userId: string }) {
  return (
    <GamificationProvider userId={userId} showHUD={true}>
      <div className="space-y-6">
        {/* HUD flotante */}
        <GamificationHUD profile={null} position="top-right" />

        {/* Contenido existente del dashboard */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Dashboard Principal</h2>
          <p className="text-zinc-400">Tu contenido existente funciona normalmente</p>
        </div>

        {/* Panel de logros */}
        <GamificationAchievementsPanel />
      </div>
    </GamificationProvider>
  );
}

// Componente que usa el contexto de gamificación
function GamificationAchievementsPanel() {
  const gamification = useGamificationContext();

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">🏆 Logros de Gamificación</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gamification.achievements.slice(0, 4).map((userAchievement: UserAchievement) => (
          <AchievementCard
            key={userAchievement.id}
            achievement={{
              id: userAchievement.achievementId,
              name: 'Logro de Usuario',
              description: 'Logro obtenido por el usuario',
              icon: '🏆',
              category: AchievementCategory.PROJECTS,
              rarity: AchievementRarity.COMMON,
              points: 100,
              requirements: [],
              isActive: true,
              isSecret: false,
              tags: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }}
            userAchievement={userAchievement}
            showProgress={true}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}

// Ejemplo de integración mínima (solo HUD)
export function MinimalGamificationIntegration({ userId }: { userId: string }) {
  return (
    <GamificationProvider userId={userId} showHUD={true} hudPosition="bottom-right">
      <div>
        {/* Tu contenido existente aquí */}
        <h1>Mi aplicación funciona normalmente</h1>
        <p>El HUD de gamificación aparece flotando sin interferir</p>
      </div>
    </GamificationProvider>
  );
}

// Ejemplo de página dedicada de gamificación
export function GamificationPage({ userId }: { userId: string }) {
  return (
    <GamificationProvider userId={userId} showHUD={false}>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">🎮 Centro de Gamificación</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Logros */}
            <div>
              <h2 className="text-2xl font-bold mb-4">🏆 Mis Logros</h2>
              <div className="space-y-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <AchievementCard
                    key={i}
                    achievement={{
                      id: `achievement_${i}`,
                      name: `Logro ${i + 1}`,
                      description: `Descripción del logro ${i + 1}`,
                      icon: '🏆',
                      category: 'projects' as any,
                      rarity: 'common' as any,
                      points: 100,
                      requirements: [],
                      isActive: true,
                      isSecret: false,
                      tags: [],
                      createdAt: new Date(),
                      updatedAt: new Date()
                    }}
                    showProgress={true}
                    size="md"
                  />
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div>
              <h2 className="text-2xl font-bold mb-4">🏅 Tabla de Líderes</h2>
              <LeaderboardComponent
                entries={[]}
                currentUserId={userId}
                maxEntries={10}
                showUserHighlight={true}
              />
            </div>
          </div>
        </div>
      </div>
    </GamificationProvider>
  );
}