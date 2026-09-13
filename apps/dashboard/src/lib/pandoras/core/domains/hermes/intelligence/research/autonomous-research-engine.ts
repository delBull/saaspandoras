/**
 * 🛰️ Hermes OS — Autonomous Research Workflows Engine (F7)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/research/autonomous-research-engine.ts
 *
 * Implements end-to-end Autonomous Research Loop:
 * Competitor Crawl -> Delta Detection -> Sovereign Vault Candidate -> Growth OS Directives
 */

import { SeoCompetitorEngine } from '../seo/seo-competitor-engine';
import { 
  ResearchMissionConfig, 
  ResearchMissionReport, 
  DeltaMetric 
} from './contracts';

export class AutonomousResearchEngine {
  private static historicalSnapshots: Map<string, Map<string, number>> = new Map();

  public static async executeMission(config: ResearchMissionConfig): Promise<ResearchMissionReport> {
    if (!config.tenantId || !config.tenantUrl) {
      throw new Error('[AutonomousResearchEngine] tenantId and tenantUrl are required.');
    }

    const executedAt = new Date().toISOString();

    // 1. Ejecutar análisis comparativo competitivo
    const competitorReport = await SeoCompetitorEngine.analyze({
      tenantUrl: config.tenantUrl,
      competitorUrls: config.competitorUrls,
      targetTopics: config.targetKeywords,
    });

    // 2. Detección de Deltas Fácticos frente a corridas previas
    const deltasFound: DeltaMetric[] = [];
    let tenantHistory = this.historicalSnapshots.get(config.tenantId);
    if (!tenantHistory) {
      tenantHistory = new Map();
      this.historicalSnapshots.set(config.tenantId, tenantHistory);
    }

    for (const comp of competitorReport.competitors) {
      const prevWordCount = tenantHistory.get(comp.url);
      if (prevWordCount !== undefined) {
        const diff = comp.wordCount - prevWordCount;
        if (Math.abs(diff) > 100) {
          deltasFound.push({
            metricName: 'word_count_change',
            competitorUrl: comp.url,
            previousValue: prevWordCount,
            currentValue: comp.wordCount,
            significance: Math.abs(diff) > 300 ? 'HIGH' : 'MEDIUM',
            description: `El competidor modificó su volumen de contenido en ${diff > 0 ? '+' : ''}${diff} palabras.`,
          });
        }
      }
      // Actualizar snapshot histórico
      tenantHistory.set(comp.url, comp.wordCount);
    }

    // 3. Preparación de Evidencia para el Sovereign Knowledge Vault
    const vaultCandidateKey = `market.competitor_intelligence.${config.tenantId}`;
    let candidateCid: string | undefined;

    if (config.ipfsVaultService?.ipfsOrchestrator) {
      try {
        const payload = JSON.stringify({
          missionId: config.missionId,
          tenantId: config.tenantId,
          executedAt,
          deltas: deltasFound,
          directives: competitorReport.growthOsDirectives,
        });
        const pinResult = await config.ipfsVaultService.ipfsOrchestrator.pinContent(
          payload,
          `research_${config.missionId}.json`,
          'application/json'
        );
        candidateCid = pinResult?.cid || pinResult?.IpfsHash;
      } catch (pinErr) {
        console.warn('[AutonomousResearchEngine] Non-blocking IPFS pinning warning for candidate:', pinErr);
      }
    }

    return {
      missionId: config.missionId,
      tenantId: config.tenantId,
      executedAt,
      competitorsAnalyzed: competitorReport.competitors.length,
      deltasFound,
      captureOpportunities: competitorReport.captureOpportunities,
      growthOsDirectives: competitorReport.growthOsDirectives,
      vaultCandidateKey,
      candidateCid,
      candidateGovernance: {
        status: 'DISCOVERED',
        requiresHumanApproval: true,
        isDirectlyTrusted: false,
        authority: 'DISCOVERED',
      },
    };
  }

  public static clearHistory(): void {
    this.historicalSnapshots.clear();
  }
}
