/**
 * 📦 Hermes OS — Autonomous Research Public API (F7)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/research/index.ts
 */

import { HermesToolExecutor } from '../../runtime/tool-executor';
import { AutonomousResearchEngine } from './autonomous-research-engine';

export * from './contracts';
export * from './autonomous-research-engine';

/**
 * Registers Autonomous Research tools into HermesToolExecutor.
 */
export function registerResearchTools(executor: HermesToolExecutor): void {
  executor.registerHandler('research.run_mission', async (params, context) => {
    const missionId = (params as any)?.missionId || `miss_${Date.now()}`;
    const tenantId = (params as any)?.tenantId || (context as any)?.organizationId || 'global';
    const title = (params as any)?.title || 'Misión de Inteligencia Competitiva';
    const tenantUrl = (params as any)?.tenantUrl || (params as any)?.url;
    const competitorUrls = (params as any)?.competitorUrls || [];
    const targetKeywords = (params as any)?.targetKeywords || [];
    const trigger = (params as any)?.trigger || 'MANUAL';

    return AutonomousResearchEngine.executeMission({
      missionId,
      tenantId,
      title,
      tenantUrl,
      competitorUrls,
      targetKeywords,
      trigger,
      ipfsVaultService: (params as any)?.ipfsVaultService,
    });
  });
}
