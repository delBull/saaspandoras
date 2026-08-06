import { getRawPhases, calculatePhaseStatus, PhaseStatus } from '@/lib/phase-utils';
import { fetchProjectOnChainData } from '@/lib/projects/stats';

export interface LivePhase {
  name: string;
  tokenPrice: number;
  tokenAllocation: number;
  status: PhaseStatus;
}

export interface LivePhaseData {
  phases: LivePhase[];
  activePhase?: LivePhase;
  currentSupply: number;
  hasOnChainData: boolean;
}

/**
 * Resolves REAL live phases for a project using on-chain supply + sequential
 * phase accumulation. Never falls back to hardcoded pricing.
 *
 * NOTE: Do NOT pass `project.id` — `getProjectPhases`/`getRawPhases` need the
 * full project record (w2eConfig / artifacts) to extract phases.
 */
export async function getLivePhaseData(project: any): Promise<LivePhaseData> {
  const { totalSupply } = await fetchProjectOnChainData(project);
  const currentSupply = Number(totalSupply) || 0;

  const rawPhases = getRawPhases(project);
  if (!rawPhases.length) {
    return { phases: [], currentSupply, hasOnChainData: false };
  }

  let accumulatedTokens = 0;
  const phases: LivePhase[] = rawPhases.map((phase: any) => {
    const status = calculatePhaseStatus(phase, currentSupply, accumulatedTokens);
    accumulatedTokens += Number(phase.tokenAllocation || phase.limit || 0);
    return {
      name: String(phase.name || 'Fase'),
      tokenPrice: Number(phase.tokenPrice || phase.price || 0),
      tokenAllocation: Number(phase.tokenAllocation || phase.limit || 0),
      status
    };
  });

  const activePhase = phases.find(
    (p) => p.status.status === 'active' && p.status.isClickable
  ) || phases.find((p) => p.status.status === 'active');

  return { phases, activePhase, currentSupply, hasOnChainData: true };
}
