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
import { MemoryStrategyDecisionRepository } from '../src/lib/pandoras/infrastructure/repositories/memory-strategy-decision-repository';

async function runBlueprint() {
  console.log('\n==================================================');
  console.log('🏛️ Pandora\'s OS - Sprint 21: Strategy Decision Persistence');
  console.log('==================================================\n');

  // Inicializar Dependencias de Hermes (Strategy)
  const globalDB = new MemoryMissionRepository();
  const globalPackDB = new MemoryInstalledPackRepository();
  const missionEventBus = MissionEventBus.getInstance();
  const missionManager = new MissionManager(globalDB, missionEventBus);
  const missionPlanner = new MissionPlanner();
  const registry = PackRegistry.getInstance();
  
  registry.register(SNARAI_PACK);
  const orgId = 'org_snarai_sprint21';

  // Inicializar Repositorio de Decisiones Estratégicas
  const strategyDecisionRepo = new MemoryStrategyDecisionRepository();

  // Inicializar Dependencias de Governance
  const governanceEventBus = GovernanceEventBus.getInstance();
  const intentRepo = new MemoryOperationalIntentRepository();
  const policyEvaluator = new PolicyEvaluator();
  const intentManager = new IntentManager(intentRepo, policyEvaluator, governanceEventBus);
  const approvalService = new ApprovalService(intentRepo, governanceEventBus);

  // Suscribir Handlers Estratégicos
  const analyticsHandler = new AnalyticsHandler();
  const snapshotHandler = new SnapshotHandler(missionManager);
  // PlannerHandler ahora recibe el repositorio para persistir la decisión
  const plannerHandler = new PlannerHandler(missionManager, missionPlanner, missionEventBus, intentManager, strategyDecisionRepo);

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
    // Avanzamos directo a la fase de campañas para saltarnos la inicialización
    await missionManager.updateState(missionId, 'campaign_execution'); 
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n----- PASO 2: Completar Milestone (Dispara Evento Estratégico) -----');
  console.log(`[Usuario] Confirma acción: "branding_ready"`);
  // Esto desencadenará PlannerHandler -> planNextAction -> crea decision "start lead generation" -> persiste en DB -> pasa a IntentManager
  await missionManager.completeMilestone(missionId, 'branding_ready');
  
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n----- PASO 3: Intervención Humana (Aprobación) -----');
  let intents = await intentRepo.getByMissionId(missionId);
  let pendingIntent = intents.find(i => i.status === 'pending_approval');

  if (pendingIntent) {
    console.log(`[Human Governance] Founder revisa intención: ${pendingIntent.intentType}`);
    await approvalService.approve(pendingIntent.id, 'founder_wallet_123', 'Presupuesto autorizado');
    
    // Dispatch manual para simular el listener
    const approvedIntent = await intentRepo.getById(pendingIntent.id);
    if(approvedIntent) {
       intentManager.dispatchToExecutionOS(approvedIntent);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n----- PASO 4: Auditoría de Gobernabilidad (Audit Trail) -----');
  console.log('Reconstruyendo la cadena completa de decisión a ejecución...');
  
  const allDecisions = await strategyDecisionRepo.getByMissionId(missionId);
  
  if (allDecisions.length > 0) {
    const dec = allDecisions[0];
    console.log(`\n1️⃣  [StrategyDecision] ID: ${dec.id}`);
    console.log(`   Type: ${dec.decisionType}`);
    console.log(`   Pack: ${dec.packId} (v${dec.packVersion})`);
    console.log(`   Decision: ${dec.decision}`);
    console.log(`   Reason Summary: ${dec.reason.summary}`);
    
    const oi = (await intentRepo.getByMissionId(missionId)).find(i => i.strategyDecisionId === dec.id);
    if (oi) {
      console.log(`\n   ↓`);
      console.log(`2️⃣  [OperationalIntent] ID: ${oi.id}`);
      console.log(`   IntentType: ${oi.intentType}`);
      console.log(`   Status: ${oi.status}`);
      console.log(`   Constraints: ${JSON.stringify(oi.constraints)}`);
      
      const approval = oi.approvals?.[0];
      if (approval) {
        console.log(`\n   ↓`);
        console.log(`3️⃣  [Governance Approval]`);
        console.log(`   Decision: ${approval.decision.toUpperCase()}`);
        console.log(`   Actor: ${approval.actorId}`);
        console.log(`   Reason: ${approval.reason}`);
        
        console.log(`\n   ↓`);
        console.log(`4️⃣  [ExecutionRequest] => Dispatch to OS`);
      }
    }
  }

  console.log('\n==================================================');
  console.log('✅ Blueprint V21 (Strategy Persistence) Completado.');
  process.exit(0);
}

runBlueprint().catch(console.error);
