import { MissionManager } from '../src/lib/pandoras/core/domains/hermes/mission-manager';
import { MissionPlanner } from '../src/lib/pandoras/core/domains/hermes/mission-planner';
import { SNARAI_PACK } from '../src/lib/pandoras/packs/snarai-pack/manifest';
import { PackRegistry } from '../src/lib/pandoras/core/registry/pack-registry';
import { MemoryMissionRepository } from '../src/lib/pandoras/infrastructure/repositories/memory-mission-repository';
import { MemoryInstalledPackRepository } from '../src/lib/pandoras/infrastructure/repositories/memory-installed-pack-repository';
import { MissionEventBus } from '../src/lib/pandoras/core/domains/hermes/events/mission-event-bus';
import { GovernanceEventBus } from '../src/lib/pandoras/core/domains/governance/events/governance-event-bus';
import { AnalyticsHandler } from '../src/lib/pandoras/core/domains/hermes/events/handlers/analytics-handler';
import { SnapshotHandler } from '../src/lib/pandoras/core/domains/hermes/events/handlers/snapshot-handler';
import { PlannerHandler } from '../src/lib/pandoras/core/domains/hermes/events/handlers/planner-handler';
import { IntentManager } from '../src/lib/pandoras/core/domains/governance/intent-manager';
import { ApprovalService } from '../src/lib/pandoras/core/domains/governance/approval-service';
import { PolicyEvaluator } from '../src/lib/pandoras/core/domains/governance/policy-evaluator';
import { MemoryOperationalIntentRepository } from '../src/lib/pandoras/infrastructure/repositories/memory-operational-intent-repository';

async function runBlueprint() {
  console.log('\n==================================================');
  console.log('🏛️ Pandora\'s OS - Sprint 20.5: Operational Intent Layer');
  console.log('==================================================\n');

  // Inicializar Dependencias de Hermes (Strategy)
  const globalDB = new MemoryMissionRepository();
  const globalPackDB = new MemoryInstalledPackRepository();
  const missionEventBus = MissionEventBus.getInstance();
  const missionManager = new MissionManager(globalDB, missionEventBus);
  const missionPlanner = new MissionPlanner();
  const registry = PackRegistry.getInstance();
  
  registry.register(SNARAI_PACK);
  const orgId = 'org_snarai_sprint20_5';

  // Inicializar Dependencias de Governance
  const governanceEventBus = GovernanceEventBus.getInstance();
  const intentRepo = new MemoryOperationalIntentRepository();
  const policyEvaluator = new PolicyEvaluator();
  const intentManager = new IntentManager(intentRepo, policyEvaluator, governanceEventBus);
  const approvalService = new ApprovalService(intentRepo, governanceEventBus);

  // Suscribir Handlers Estratégicos
  const analyticsHandler = new AnalyticsHandler();
  const snapshotHandler = new SnapshotHandler(missionManager);
  const plannerHandler = new PlannerHandler(missionManager, missionPlanner, missionEventBus, intentManager);

  missionEventBus.subscribe('MILESTONE_COMPLETED', analyticsHandler);
  missionEventBus.subscribe('MILESTONE_COMPLETED', snapshotHandler);
  missionEventBus.subscribe('MILESTONE_COMPLETED', plannerHandler);
  missionEventBus.subscribe('PHASE_CHANGED', analyticsHandler);
  missionEventBus.subscribe('PHASE_CHANGED', snapshotHandler);
  missionEventBus.subscribe('PHASE_CHANGED', plannerHandler);
  missionEventBus.subscribe('STRATEGY_CHANGED', snapshotHandler);

  console.log('----- PASO 1: Creación de Misión -----');
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
    await missionManager.updateState(missionId, template.initialState); // a market_preparation
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n----- PASO 2: Completar Milestone (Dispara Evento Estratégico) -----');
  console.log(`[Usuario] Confirma acción: "branding_ready"`);
  await missionManager.completeMilestone(missionId, 'branding_ready');
  
  // Pequeña pausa para permitir que el PlannerHandler escuche y el IntentManager cree el intent
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n----- PASO 3: Intervención Humana (Rechazo) -----');
  // Buscaríamos la intención propuesta
  let intents = await intentRepo.getByMissionId(missionId);
  let pendingIntent = intents.find(i => i.status === 'pending_approval');

  if (pendingIntent) {
    console.log(`[Human Governance] Founder revisa intención: ${pendingIntent.intentType}`);
    await approvalService.reject(pendingIntent.id, 'founder_wallet_123', 'Esperar cierre legal de la propiedad');
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n----- PASO 4: Nueva Evaluación y Aprobación -----');
  // Simulamos que el problema legal se resolvió, forzamos un evento o el planner vuelve a generar la intención
  console.log(`[Simulación] Se completa "legal_ready" y Hermes vuelve a sugerir lead generation...`);
  // Haremos trampa y generaremos directamente la decisión al IntentManager para ver la aprobación
  const newIntent = await intentManager.proposeIntent(
    orgId, missionId, SNARAI_PACK.id, SNARAI_PACK.version, `sdec_${Date.now()}`,
    {
      decision: "start lead generation",
      reason: ["legal ready", "branding ready"],
      workflow: "marketing.lead_generation.v1"
    }
  );

  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`\n[Human Governance] Founder revisa la nueva intención: ${newIntent.intentType}`);
  await approvalService.approve(newIntent.id, 'founder_wallet_123', 'Documentación lista, podemos gastar en marketing');

  // El sistema de gobernanza escucharía el OPERATIONAL_INTENT_APPROVED y lanzaría dispatchToExecutionOS
  // Como simulamos la conexión, la ejecutamos a mano:
  intentManager.dispatchToExecutionOS(await intentRepo.getById(newIntent.id) as any);

  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n==================================================');
  console.log('✅ Blueprint V20.5 (Operational Intent) Completado.');
  process.exit(0);
}

runBlueprint().catch(console.error);
