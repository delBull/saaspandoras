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

// Ejemplo de integración en el dashboard actual de Pandora's Finance
export function CurrentDashboardWithGamification({
  children,
  userId
}: {
  children: React.ReactNode;
  userId: string;
}) {
  return (
    <GamificationProvider
      userId={userId}
      showHUD={true}
      hudPosition="top-right"
      autoRefresh={true}
      refreshInterval={30000}
    >
      <div className="fixed inset-0 flex bg-gradient-to-tr from-gray-950 to-black">
        {/* Sidebar existente */}
        <div className="w-80 bg-zinc-900 border-r border-gray-800">
          <div className="p-6">
            <h2 className="text-white text-lg font-bold">Pandora's Finance</h2>
          </div>
        </div>

        {/* Main content con gamificación */}
        <main className="flex-1 relative h-screen overflow-y-auto p-8 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* HUD flotante */}
            <GamificationHUD profile={null} position="top-right" />

            {/* Contenido existente */}
            {children}

            {/* Panel de gamificación opcional */}
            <GamificationPanel />
          </div>
        </main>
      </div>
    </GamificationProvider>
  );
}

// Panel de gamificación que se puede mostrar/ocultar
function GamificationPanel() {
  const gamification = useGamificationContext();

  return (
    <div className="mt-8 space-y-6">
      {/* Dashboard de métricas de gamificación */}
      <GamificationDashboard
        profile={gamification.profile}
        achievements={gamification.achievements}
        rewards={gamification.rewards}
        leaderboard={gamification.leaderboard}
        isLoading={gamification.isLoading}
      />

      {/* Acciones de gamificación */}
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

// Ejemplo de cómo modificar el layout actual
export function EnhancedLayout({
  children,
  userId,
  isAdmin,
  isSuperAdmin
}: {
  children: React.ReactNode;
  userId: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}) {
  return (
    <GamificationProvider userId={userId}>
      <div className="fixed inset-0 flex bg-gradient-to-tr from-gray-950 to-black">
        <div className="w-80 bg-zinc-900 border-r border-gray-800">
          <div className="p-6">
            <h2 className="text-white text-lg font-bold">Pandora's Finance</h2>
          </div>
        </div>

        <main className="flex-1 relative h-screen overflow-y-auto p-8 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <GamificationHUD profile={null} position="top-right" />
            {children}
          </div>
        </main>
      </div>
    </GamificationProvider>
  );
}

// Ejemplo de página específica con gamificación
export function GamifiedApplicantsPage({ userId }: { userId: string }) {
  return (
    <GamificationProvider userId={userId}>
      <div className="space-y-6">
        <GamificationHUD profile={null} position="top-left" />

        {/* Contenido existente de aplicantes */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Protocolos Disponibles</h2>
          <p className="text-zinc-400">Contenido de aplicantes existente...</p>
        </div>

        {/* Logros recientes */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">🏆 Logros Recientes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
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
              />
            ))}
          </div>
        </div>
      </div>
    </GamificationProvider>
  );
}