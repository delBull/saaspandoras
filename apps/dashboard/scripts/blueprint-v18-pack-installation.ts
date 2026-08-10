import { ExecutionBootstrap } from '../src/lib/pandoras/bootstrap/execution-bootstrap';
import { MissionManager } from '../src/lib/pandoras/core/domains/hermes/mission-manager';
import { GoalRecognizer } from '../src/lib/pandoras/core/domains/hermes/goal-recognizer';
import { MissionPlanner } from '../src/lib/pandoras/core/domains/hermes/mission-planner';
import { SNARAI_PACK } from '../src/lib/pandoras/packs/snarai-pack/manifest';
import { ConversationMessage } from '../src/lib/pandoras/core/domains/hermes/contracts';
import { PackRegistry } from '../src/lib/pandoras/core/registry/pack-registry';
import { InstalledPack } from '../src/lib/pandoras/core/contracts/pack-contracts';

async function runBlueprint() {
  console.log('\n==================================================');
  console.log('📦 Pandora\'s OS - Sprint 18: Ideal Pack Lifecycle');
  console.log('==================================================\n');

  // Dependencias core
  const missionManager = new MissionManager();
  const goalRecognizer = new GoalRecognizer();
  const missionPlanner = new MissionPlanner();
  const bootstrap = new ExecutionBootstrap();
  const registry = PackRegistry.getInstance();
  
  // 1. REGISTRY & INSTALACIÓN (Fase 1 - Installation)
  console.log('----- FASE 1: Pack Registry & Installation -----');
  registry.register(SNARAI_PACK);
  console.log(`[PackRegistry] Registrando manifiesto global: ${SNARAI_PACK.name} v${SNARAI_PACK.version}`);
  
  // La organización instala formalmente la capacidad
  const snaraiInstallation: InstalledPack = {
    organizationId: 'org_snarai_official',
    packId: SNARAI_PACK.id,
    version: SNARAI_PACK.version,
    status: 'active',
    installedAt: new Date().toISOString()
  };
  console.log(`[OrganizationRuntime] Inquilino "S'Narai Official" instala el Pack: ${snaraiInstallation.packId} (Status: ${snaraiInstallation.status})`);
  
  const packDefinition = registry.get(snaraiInstallation.packId);
  if (packDefinition?.lifecycle?.onInstall) {
    packDefinition.lifecycle.onInstall.forEach(event => {
      console.log(`[Lifecycle:onInstall] Ejecutando evento de instalación de ${packDefinition.name}: ${event}`);
    });
  }

  // 2. ARRANQUE (Fase 2 - Bootstrap)
  console.log('\n----- FASE 2: Bootstrap de la Identidad -----');
  const tenantId = 'tenant_snarai_123';
  const userId = 'usr_marco_456';
  const channel = 'telegram';
  const snapshot = await bootstrap.hydrateIdentity(tenantId, userId, channel);
  
  // Snapshot SOLO expone Installed Packs (no las misiones completas)
  const snapshotWithPacks = {
    ...snapshot,
    packs: { installed: [snaraiInstallation.packId] } // La base de datos resolvería esto
  };
  
  console.log(`[Bootstrap] Identidad hidratada. Packs activos disponibles: ${snapshotWithPacks.packs.installed.join(', ')}`);

  // 3. INFERENCIA (Fase 3 - Goal Creation)
  console.log('\n----- FASE 3: Goal Creation (Inferencia) -----');
  const msg1: ConversationMessage = {
    identitySnapshot: snapshotWithPacks,
    text: "Quiero lanzar el proyecto" // Ya no tiene la palabra s'narai
  };
  
  // Simulamos que el Recognizer mapea esta intención de texto general contra el catálogo del Pack
  console.log(`[Usuario] "${msg1.text}"`);
  console.log(`[GoalRecognizer] Extrayendo Goal Templates del PackRegistry para el pack activo: ${snaraiInstallation.packId}`);
  const snaraiGoals = packDefinition?.goals || [];
  
  let activeMissionId: string | undefined;

  // El recognizer (mockeado) asocia la intención al primer goal del pack
  console.log(`[GoalRecognizer] 🎯 Goal reconocido mapeando a: ${snaraiGoals[0].name}`);
  
  const template = packDefinition?.missions.find(m => m.template === 'property_launch');
  if (template) {
    const newMission = missionManager.createMission(
      snaraiGoals[0].name,
      snaraiGoals[0].milestones,
      []
    );
    activeMissionId = newMission.id;
    missionManager.updateState(newMission.id, template.initialState);
    
    console.log(`[MissionManager] Misión creada: ${newMission.id}`);
    console.log(`[MissionManager] Fase inicial (definida por el Pack): ${newMission.state.phase}`);
  }

  // 4. CONTINUIDAD (Fase 4 - Mission Continuity)
  console.log('\n----- FASE 4: Mission Continuity (Mission Persistence Boundary) -----');
  console.log('...El tiempo pasa (La memoria está mockeada por ahora, persistencia en DB para el siguiente sprint)...');
  console.log(`[Usuario] "¿Qué sigue?"`);
  
  if (activeMissionId) {
    const recoveredMission = missionManager.getMission(activeMissionId);
    if (recoveredMission) {
      console.log(`[MissionManager] Recuperando estado de la misión activa...`);
      console.log(`[Hermes] Misión activa: "${recoveredMission.goal.objective}"`);
      console.log(`[Hermes] Estado actual: ${recoveredMission.state.phase}`);
      
      const plan = await missionPlanner.planNextAction(recoveredMission);
      if (plan) {
        const recommendedAction = packDefinition?.actions.find(a => a.id === 'launch_product');
        if (recommendedAction) {
          console.log(`[Hermes] Siguiente acción operativa disponible: ${recommendedAction.id}`);
          console.log(`[ExecutionOS] Se mapeará la acción al workflow: ${recommendedAction.execution.workflow}`);
        }
      }
    }
  }

  // 5. EVOLUCIÓN (Fase 5 - Mission Evolution)
  console.log('\n----- FASE 5: Mission Evolution -----');
  console.log(`[Usuario] "Ya tenemos branding listo"`);
  
  if (activeMissionId) {
    console.log(`[GoalRecognizer] Detectado hito logrado.`);
    missionManager.completeMilestone(activeMissionId, 'branding_ready');
    const evolvedMission = missionManager.getMission(activeMissionId);
    if (evolvedMission) {
      const milestone = evolvedMission.milestones.find(m => m.name === 'branding_ready');
      console.log(`[MissionManager] Actualizando milestone: branding_ready = ${milestone?.completed}`);
      
      // La fase podría avanzar gracias al hito
      missionManager.updateState(activeMissionId, 'campaign_execution');
      console.log(`[MissionManager] Avanzando State. Nuevo Estado: ${evolvedMission.state.phase}`);
    }
  }

  console.log('\n==================================================');
  console.log('✅ Blueprint Ideal Completado.');
}

runBlueprint().catch(console.error);
