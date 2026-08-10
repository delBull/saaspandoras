import { ExecutionBootstrap } from '../src/lib/pandoras/bootstrap/execution-bootstrap';
import { HermesShell } from '../src/lib/pandoras/core/domains/hermes/hermes-shell';
import { ConversationMessage } from '../src/lib/pandoras/core/domains/hermes/contracts';
import { MissionManager } from '../src/lib/pandoras/core/domains/hermes/mission-manager';
import { GoalRecognizer } from '../src/lib/pandoras/core/domains/hermes/goal-recognizer';
import { MissionPlanner } from '../src/lib/pandoras/core/domains/hermes/mission-planner';

async function runBlueprint() {
  console.log('\n==================================================');
  console.log('🚀 Pandora\'s OS - Sprint 17: Goal-Oriented Hermes');
  console.log('==================================================\n');

  // 1. Instanciar dependencias de Hermes
  const missionManager = new MissionManager();
  const goalRecognizer = new GoalRecognizer();
  const missionPlanner = new MissionPlanner();
  const bootstrap = new ExecutionBootstrap();
  
  // Simulamos al Shell recibiendo sus nuevas dependencias estratégicas (en el futuro se inyectarán)
  // Por ahora lo simulamos aquí en el Blueprint

  const tenantId = 'tenant_snarai_123';
  const userId = 'usr_marco_456';
  const channel = 'telegram';

  console.log('----- FASE 1: Recepción y Bootstrap -----');
  const snapshot = await bootstrap.hydrateIdentity(tenantId, userId, channel);

  const incomingMessage: ConversationMessage = {
    identitySnapshot: snapshot,
    text: "Quiero lanzar S'Narai"
  };

  console.log('\n----- FASE 2: Reconocimiento Estratégico (Goal Recognizer) -----');
  const recognition = await goalRecognizer.analyze(incomingMessage);
  
  let activeMission;

  if (recognition.type === 'NEW_GOAL' && recognition.extractedGoal) {
    console.log('\n----- FASE 3: Gestión de Misión (Mission Manager) -----');
    activeMission = missionManager.createMission(
      recognition.extractedGoal.objective,
      recognition.extractedGoal.successCriteria,
      [{ type: 'budget', value: 50000 }]
    );
    console.log(`[MissionManager] Misión creada: ${activeMission.id} | Estado: ${activeMission.state.phase}`);
  }

  if (activeMission) {
    console.log('\n----- FASE 4: Planeación de Acción (Mission Planner) -----');
    const plan = await missionPlanner.planNextAction(activeMission);
    
    if (plan) {
      console.log(`\n----- FASE 5: Delegación al Execution OS -----`);
      console.log(`[ExecutionOS] Recibida orden de ejecutar workflow: ${plan.steps[0].workflowId}`);
      console.log(`[ExecutionOS] Arrancando máquina de estados bajo identidad: ${snapshot.organization.name}`);
      
      // Simulamos que el OS arranca la instancia
      const execId = `exec_${Date.now()}`;
      missionManager.registerExecution(activeMission.id, execId);
      missionManager.updateState(activeMission.id, 'commercial_validation');
      
      console.log(`\n[Resultado Final] Misión actualizada. Fase actual: ${missionManager.getMission(activeMission.id)?.state.phase}`);
      console.log(`[Resultado Final] Ejecuciones asociadas:`, missionManager.getMission(activeMission.id)?.executions);
    }
  }

  console.log('\n==================================================');
  console.log('✅ Blueprint Completado.');
}

runBlueprint().catch(console.error);
