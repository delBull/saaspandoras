"use client";

import {
  GamificationProvider,
  GamificationHUD,
  GamificationDashboard,
  AchievementCard,
  LeaderboardComponent,
  useGamificationContext,
  EventType
} from '../index';

// Ejemplo de integración en el dashboard actual
export function DashboardWithGamification({ userId }: { userId: string }) {
  return (
    <GamificationProvider
      userId={userId}
      showHUD={true}
      hudPosition="top-right"
      autoRefresh={true}
      refreshInterval={30000}
    >
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        {/* HUD flotante */}
        <GamificationHUD profile={null} position="top-right" />

        {/* Contenido principal */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <GamificationContent />
          </div>
        </main>
      </div>
    </GamificationProvider>
  );
}

// Componente que usa el contexto de gamificación
function GamificationContent() {
  const gamification = useGamificationContext();

  return (
    <div className="space-y-8">
      {/* Header con stats de gamificación */}
      <div className="bg-zinc-900/50 border border-lime-500/20 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-white mb-4">Dashboard con Gamificación</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-lime-400">{gamification.currentLevel}</div>
            <div className="text-sm text-zinc-400">Nivel</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{gamification.totalPoints}</div>
            <div className="text-sm text-zinc-400">Puntos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{gamification.completedAchievements.length}</div>
            <div className="text-sm text-zinc-400">Logros</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{gamification.levelProgress}%</div>
            <div className="text-sm text-zinc-400">Progreso</div>
          </div>
        </div>
      </div>

      {/* Dashboard completo de gamificación */}
      <GamificationDashboard
        profile={gamification.profile}
        achievements={gamification.achievements}
        rewards={gamification.rewards}
        leaderboard={gamification.leaderboard}
        isLoading={gamification.isLoading}
      />

      {/* Acciones de ejemplo */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">🎮 Sistema de Gamificación</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => gamification.trackEvent(EventType.PROJECT_APPLICATION_SUBMITTED)}
            className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-black font-bold rounded-lg transition-colors"
          >
            Simular Aplicación de Proyecto
          </button>
          <button
            onClick={() => gamification.trackEvent(EventType.DAILY_LOGIN)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
          >
            Simular Login Diario
          </button>
          <button
            onClick={() => gamification.refresh()}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg transition-colors"
          >
            Actualizar Datos
          </button>
        </div>
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