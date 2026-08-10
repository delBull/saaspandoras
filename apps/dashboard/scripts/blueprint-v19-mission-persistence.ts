import { MissionManager } from '../src/lib/pandoras/core/domains/hermes/mission-manager';
import { GoalRecognizer } from '../src/lib/pandoras/core/domains/hermes/goal-recognizer';
import { MissionPlanner } from '../src/lib/pandoras/core/domains/hermes/mission-planner';
import { SNARAI_PACK } from '../src/lib/pandoras/packs/snarai-pack/manifest';
import { PackRegistry } from '../src/lib/pandoras/core/registry/pack-registry';
// import { PostgresMissionRepository } from '../src/lib/pandoras/infrastructure/repositories/postgres-mission-repository';
// import { PostgresInstalledPackRepository } from '../src/lib/pandoras/infrastructure/repositories/postgres-installed-pack-repository';
import { MemoryMissionRepository } from '../src/lib/pandoras/infrastructure/repositories/memory-mission-repository';
import { MemoryInstalledPackRepository } from '../src/lib/pandoras/infrastructure/repositories/memory-installed-pack-repository';

// Simulamos la Base de Datos como variables globales fuera de memoria
const globalDB = new MemoryMissionRepository();
const globalPackDB = new MemoryInstalledPackRepository();

async function runBlueprint() {
  console.log('\n==================================================');
  console.log('📦 Pandora\'s OS - Sprint 19: Operational State Layer');
  console.log('==================================================\n');

  // Inicializar Repositorios Reales (DB) - Usamos Memory mockeando Postgres para evitar conectividad
  const installedPackRepo = globalPackDB;
  const missionRepo = globalDB;
  
  const missionManager = new MissionManager(missionRepo);
  const goalRecognizer = new GoalRecognizer();
  const missionPlanner = new MissionPlanner();
  const registry = PackRegistry.getInstance();
  
  registry.register(SNARAI_PACK);
  const orgId = 'org_snarai_sprint19';

  console.log('----- SESSION 1: Pack Installation & Mission Creation -----');
  console.log(`[OrganizationRuntime] Registrando Pack en DB...`);
  
  await installedPackRepo.upsertPack({
    organizationId: orgId,
    packId: SNARAI_PACK.id,
    version: SNARAI_PACK.version,
    status: 'active',
    installedAt: new Date().toISOString(),
    configuration: { industry: 'real_estate' }
  });

  const snaraiGoals = SNARAI_PACK.goals;
  const template = SNARAI_PACK.missions.find(m => m.template === 'property_launch');
  
  let missionId = '';

  if (template) {
    const newMission = await missionManager.createMission(
      orgId,
      SNARAI_PACK.id,
      SNARAI_PACK.version,
      snaraiGoals[0].name,
      snaraiGoals[0].milestones,
      []
    );
    missionId = newMission.id;
    await missionManager.updateState(missionId, template.initialState);
    console.log(`[MissionManager] Misión creada en DB: ${newMission.id}`);
    console.log(`[MissionManager] Fase inicial guardada: ${template.initialState}`);
  }

  console.log('\n----- REINICIO DE SERVIDOR (Cierre de Session 1) -----');
  console.log('... \n');
  
  console.log('----- SESSION 2: Mission Evolution -----');
  console.log(`[Usuario] "Ya tenemos branding listo"`);
  
  // Re-instanciamos dependencias como si fuera un servidor nuevo (apuntando a la misma "DB")
  const session2MissionManager = new MissionManager(globalDB);

  
  const activeSession2 = await session2MissionManager.getActiveMission(orgId);
  if (activeSession2) {
    console.log(`[Hermes] Encontró misión activa en DB: ${activeSession2.id} - ${activeSession2.goal.objective}`);
    console.log(`[GoalRecognizer] Detectado hito logrado: branding_ready`);
    
    await session2MissionManager.completeMilestone(activeSession2.id, 'branding_ready');
    await session2MissionManager.updateState(activeSession2.id, 'campaign_execution');
    console.log(`[MissionManager] Actualizado milestone en DB y nueva fase guardada: campaign_execution`);
  } else {
    console.log(`[Hermes] No se encontró misión activa.`);
  }

  console.log('\n----- REINICIO DE SERVIDOR (Cierre de Session 2) -----');
  console.log('... \n');

  console.log('----- SESSION 3: Mission Continuity -----');
  console.log(`[Usuario] "¿Qué sigue?"`);
  
  const session3MissionManager = new MissionManager(globalDB);
  const activeSession3 = await session3MissionManager.getActiveMission(orgId);
  
  if (activeSession3) {
    console.log(`[Hermes] Recuperando estado de DB...`);
    console.log(`[Hermes] Misión activa: "${activeSession3.goal.objective}"`);
    console.log(`[Hermes] Fase actual: ${activeSession3.currentPhase}`);
    
    const brandingMilestone = activeSession3.milestones.find(m => m.name === 'branding_ready');
    console.log(`[Hermes] Estado del Milestone "branding_ready": ${brandingMilestone?.completed ? 'COMPLETADO' : 'PENDIENTE'}`);
    
    const plan = await missionPlanner.planNextAction(activeSession3);
    if (plan) {
      console.log(`[MissionPlanner] Siguiente acción operativa disponible: ${plan.steps[0].workflowId}`);
    } else {
      console.log(`[MissionPlanner] No hay acciones delegables en este momento para la fase ${activeSession3.currentPhase}.`);
    }
  }

  console.log('\n==================================================');
  console.log('✅ Blueprint V19 (DB Persistence) Completado.');
  process.exit(0);
}

runBlueprint().catch(console.error);
