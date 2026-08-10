import { MissionManager } from '../src/lib/pandoras/core/domains/hermes/mission-manager';
import { MissionPlanner } from '../src/lib/pandoras/core/domains/hermes/mission-planner';
import { SNARAI_PACK } from '../src/lib/pandoras/packs/snarai-pack/manifest';
import { PackRegistry } from '../src/lib/pandoras/core/registry/pack-registry';
import { MemoryMissionRepository } from '../src/lib/pandoras/infrastructure/repositories/memory-mission-repository';
import { MemoryInstalledPackRepository } from '../src/lib/pandoras/infrastructure/repositories/memory-installed-pack-repository';
import { MissionEventBus } from '../src/lib/pandoras/core/domains/hermes/events/mission-event-bus';
import { AnalyticsHandler } from '../src/lib/pandoras/core/domains/hermes/events/handlers/analytics-handler';
import { SnapshotHandler } from '../src/lib/pandoras/core/domains/hermes/events/handlers/snapshot-handler';
import { PlannerHandler } from '../src/lib/pandoras/core/domains/hermes/events/handlers/planner-handler';

async function runBlueprint() {
  console.log('\n==================================================');
  console.log('🧠 Pandora\'s OS - Sprint 20: Mission Event Engine');
  console.log('==================================================\n');

  // Inicializar Dependencias
  const globalDB = new MemoryMissionRepository();
  const globalPackDB = new MemoryInstalledPackRepository();
  const eventBus = MissionEventBus.getInstance();
  
  const missionManager = new MissionManager(globalDB, eventBus);
  const missionPlanner = new MissionPlanner();
  const registry = PackRegistry.getInstance();
  
  registry.register(SNARAI_PACK);
  const orgId = 'org_snarai_sprint20';

  // Suscribir Handlers
  const analyticsHandler = new AnalyticsHandler();
  const snapshotHandler = new SnapshotHandler(missionManager);
  const plannerHandler = new PlannerHandler(missionManager, missionPlanner, eventBus);

  eventBus.subscribe('GOAL_CREATED', analyticsHandler);
  eventBus.subscribe('MILESTONE_COMPLETED', analyticsHandler);
  eventBus.subscribe('MILESTONE_COMPLETED', snapshotHandler);
  eventBus.subscribe('MILESTONE_COMPLETED', plannerHandler);
  eventBus.subscribe('PHASE_CHANGED', analyticsHandler);
  eventBus.subscribe('PHASE_CHANGED', snapshotHandler);
  eventBus.subscribe('PHASE_CHANGED', plannerHandler);
  eventBus.subscribe('STRATEGY_CHANGED', snapshotHandler);

  console.log('----- PASO 1: Pack Installation & Mission Creation -----');
  await globalPackDB.upsertPack({
    organizationId: orgId,
    packId: SNARAI_PACK.id,
    version: SNARAI_PACK.version,
    status: 'active',
    installedAt: new Date().toISOString(),
    configuration: { industry: 'real_estate' }
  });

  const template = SNARAI_PACK.missions.find(m => m.template === 'property_launch');
  let missionId = '';

  if (template) {
    const newMission = await missionManager.createMission(
      orgId,
      SNARAI_PACK.id,
      SNARAI_PACK.version,
      SNARAI_PACK.goals[0].name,
      SNARAI_PACK.goals[0].milestones,
      []
    );
    missionId = newMission.id;
    // Disparará PHASE_CHANGED
    await missionManager.updateState(missionId, template.initialState);
  }

  // Pequeña pausa para permitir que las Promesas asíncronas de los eventos se completen en consola
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n----- PASO 2 & 3: Completar Milestone (Dispara Evento) -----');
  console.log(`[Usuario] Confirma acción: "branding_ready"`);
  
  // Esto actualiza el Repo y luego despacha MILESTONE_COMPLETED
  await missionManager.completeMilestone(missionId, 'branding_ready');
  
  // Pequeña pausa para permitir que el PlannerHandler escuche y decida
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('\n----- PASO 4: Transición de Fase simulada por Planner/Core -----');
  // En un sistema real el PlannerHandler que generó "start lead generation" 
  // probablemente actualizaría la fase o enviaría el comando al OS. 
  // Aquí forzaremos el cambio de fase para ver el Snapshot
  await missionManager.updateState(missionId, 'campaign_execution');

  // Pequeña pausa para permitir que las Promesas del evento se completen
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n----- PASO 5: Completar Milestone final en nueva fase -----');
  // Ya en campaign_execution, si se completa otro milestone:
  await missionManager.completeMilestone(missionId, 'leads_ready');
  
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n==================================================');
  console.log('✅ Blueprint V20 (Autonomous Strategy) Completado.');
  process.exit(0);
}

runBlueprint().catch(console.error);
