
// Script temporal para inicialización de datos de gamificación
import { initializeGamificationData, validateSystemHealth } from './src/lib/gamification/service.ts';

async function init() {
  try {
    console.log('🏗️ Inicializando datos de gamificación...');
    await initializeGamificationData();

    console.log('🔍 Validando estado del sistema...');
    const health = await validateSystemHealth();

    if (health.isHealthy) {
      console.log('✅ Sistema de gamificación inicializado correctamente');
      console.log('🎯 APIs disponibles:');
      console.log('  - POST /api/gamification/events');
      console.log('  - GET /api/gamification/profile/[userId]');
      console.log('  - GET /api/gamification/leaderboard/[type]');
      console.log('  - GET /api/gamification/rewards/[userId]');
      process.exit(0);
    } else {
      console.error('❌ Problemas encontrados:', health.errors);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error durante inicialización:', error);
    process.exit(1);
  }
}

init();
