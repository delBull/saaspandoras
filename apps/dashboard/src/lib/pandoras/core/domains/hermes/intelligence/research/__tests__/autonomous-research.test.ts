import { describe, it, expect, beforeEach } from '@jest/globals';
import { AutonomousResearchEngine } from '../autonomous-research-engine';
import { HermesToolExecutor } from '../../../runtime/tool-executor';

describe('🛰️ Hermes Autonomous Research Workflows Suite (F7)', () => {
  let executor: HermesToolExecutor;

  beforeEach(() => {
    AutonomousResearchEngine.clearHistory();
    executor = new HermesToolExecutor();
  });

  it('debe ejecutar una misión de inteligencia competitiva y retornar oportunidades de captura', async () => {
    const report = await AutonomousResearchEngine.executeMission({
      missionId: 'mission_weekly_01',
      tenantId: 'snarai',
      title: 'Monitoreo Competitivo Tulum Real Estate',
      tenantUrl: 'https://snarai.com/dealroom',
      competitorUrls: ['https://competitor-tulum.com/villas'],
      targetKeywords: ['Villas sustentables', 'Tokenización RWA'],
      trigger: 'MANUAL',
    });

    expect(report.missionId).toBe('mission_weekly_01');
    expect(report.tenantId).toBe('snarai');
    expect(report.competitorsAnalyzed).toBe(1);
    expect(report.vaultCandidateKey).toBe('market.competitor_intelligence.snarai');
    expect(report.growthOsDirectives.length).toBeGreaterThan(0);
  });

  it('debe detectar deltas fácticos de volumen de contenido entre ejecuciones sucesivas', async () => {
    // 1era corrida
    await AutonomousResearchEngine.executeMission({
      missionId: 'mission_run_01',
      tenantId: 'snarai',
      title: 'Monitoreo',
      tenantUrl: 'https://snarai.com/dealroom',
      competitorUrls: ['https://competitor-tulum.com/villas'],
      targetKeywords: ['Tulum'],
      trigger: 'SCHEDULED_CRON',
    });

    // 2da corrida (el snapshot histórico está cargado)
    const report2 = await AutonomousResearchEngine.executeMission({
      missionId: 'mission_run_02',
      tenantId: 'snarai',
      title: 'Monitoreo Delta',
      tenantUrl: 'https://snarai.com/dealroom',
      competitorUrls: ['https://competitor-tulum.com/villas'],
      targetKeywords: ['Tulum'],
      trigger: 'SCHEDULED_CRON',
    });

    expect(report2.missionId).toBe('mission_run_02');
    expect(report2.deltasFound).toBeDefined();
  });

  it('TOOL GATEWAY: debe despachar research.run_mission a través de HermesToolExecutor', async () => {
    const response = await executor.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'actor_marco',
        capabilityId: 'research.run_mission',
        toolName: 'research.run_mission',
        parameters: {
          tenantUrl: 'https://snarai.com/dealroom',
          competitorUrls: ['https://competitor-tulum.com/villas'],
          targetKeywords: ['RWA Tulum'],
        },
      },
      [{ id: 'research.run_mission' }]
    );

    expect(response.success).toBe(true);
    expect((response.data as any).competitorsAnalyzed).toBe(1);
    expect((response.data as any).vaultCandidateKey).toContain('market.competitor_intelligence');
  });
});
