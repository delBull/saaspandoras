"use client";

import { GamificationProvider } from '../components/GamificationProvider';
import { EventType } from '../types';

// Ejemplo de integración en la página de aplicación
export function ApplyPageWithGamification({ userId }: { userId: string }) {
  return (
    <GamificationProvider
      userId={userId}
      showHUD={true}
      hudPosition="top-right"
    >
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <ApplyContentWithTracking />
      </div>
    </GamificationProvider>
  );
}

// Componente que trackea eventos de aplicación
function ApplyContentWithTracking() {
  const handleApplicationStart = () => {
    // Trackear inicio de aplicación
    console.log("🎯 Gamification: Usuario inició aplicación de proyecto");
  };

  const handleApplicationComplete = () => {
    // Trackear aplicación completada
    console.log("🎉 Gamification: Usuario completó aplicación de proyecto");
  };

  const handleDraftSave = () => {
    // Trackear borrador guardado
    console.log("💾 Gamification: Usuario guardó borrador");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-white via-lime-200 to-white bg-clip-text text-transparent">
            Aplica para Tokenizar tu
          </span>
          <br />
          <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
            Proyecto Excepcional
          </span>
        </h1>

        <p className="text-xl text-zinc-400 max-w-4xl mx-auto mb-8">
          Únete al ecosistema más exclusivo de inversión tokenizada.
          <span className="text-lime-400 font-semibold"> Solo el 5% de los aplicantes</span> son seleccionados.
        </p>
      </div>

      {/* Botón que trackea el inicio de aplicación */}
      <div className="text-center">
        <button
          onClick={handleApplicationStart}
          className="bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold text-lg px-12 py-6 rounded-xl hover:scale-105 transition-transform"
        >
          Comenzar Aplicación con Gamificación
        </button>
      </div>

      {/* Información de gamificación */}
      <div className="mt-12 bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">🎮 Sistema de Gamificación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-lime-400">50 pts</div>
            <div className="text-zinc-400">Por desatar creación</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">100 pts</div>
            <div className="text-zinc-400">Por proyecto aprobado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">200 pts</div>
            <div className="text-zinc-400">Por referir usuarios</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook personalizado para integración con aplicación
export function useApplicationGamification(userId: string) {
  const trackApplicationStart = () => {
    // Trackear evento de inicio
    console.log("🎯 Tracking application start for user:", userId);
  };

  const trackApplicationComplete = () => {
    // Trackear evento de completación
    console.log("🎉 Tracking application complete for user:", userId);
  };

  const trackDraftSave = () => {
    // Trackear evento de borrador
    console.log("💾 Tracking draft save for user:", userId);
  };

  return {
    trackApplicationStart,
    trackApplicationComplete,
    trackDraftSave
  };
}