import { db } from "@saasfly/db-core";
import { eq, and, sql, inArray } from "@saasfly/db-core";
import { ResourceScope } from '../../knowledge/growth-read-adapter'; // Reusing the established ResourceScope contract

// ---- Domain Types ----
export interface RwaResult<T> {
  status: 'SUCCESS' | 'UNAVAILABLE' | 'UNAUTHORIZED' | 'NOT_APPLICABLE';
  data?: T;
  reason?: string;
}

export interface RwaProjectState {
  title: string;
  slug: string;
  currentPrice: number | string;
  phaseName: string;
  availableUnits: number;
  progressPercentage: number;
  treasury: string;
  holdersCount: number;
}

export interface RwaPortfolio {
  totalValueUsd: string;
  assets: any[];
}

export interface RwaPurchaseHistory {
  purchases: any[];
}

export interface RwaPosition {
  unitsHeld: number;
  votingPower: number;
}

export interface RwaNav {
  netAssetValue: string;
  lastUpdated: Date;
}

export interface RwaGovernanceStatus {
  activeProposals: number;
  votingPower: number;
}

export interface RwaListings {
  activeListings: any[];
}

export interface RwaEvidence {
  cid: string;
  verificationUrl: string;
}

export interface RwaPhase {
  name: string;
  tokenPrice: number;
  tokenAllocation: number;
  remainingTokens: number;
  status: any;
}

export interface RwaPhasesResult {
  phases: RwaPhase[];
  activePhase?: RwaPhase;
  currentSupply: number;
  hasOnChainData: boolean;
}

// ---- Intelligence Provider Contract ----
export interface RwaIntelligenceProviderContract {
  getProjectState(scope: ResourceScope, input?: any): Promise<RwaResult<RwaProjectState>>;
  getPhases(scope: ResourceScope, input?: any): Promise<RwaResult<RwaPhasesResult>>;
  getPortfolio(scope: ResourceScope, input?: any): Promise<RwaResult<RwaPortfolio>>;
  getPurchaseHistory(scope: ResourceScope, input?: any): Promise<RwaResult<RwaPurchaseHistory>>;
  getPosition(scope: ResourceScope, input?: any): Promise<RwaResult<RwaPosition>>;
  getNav(scope: ResourceScope, input?: any): Promise<RwaResult<RwaNav>>;
  getGovernanceStatus(scope: ResourceScope, input?: any): Promise<RwaResult<RwaGovernanceStatus>>;
  getListings(scope: ResourceScope, input?: any): Promise<RwaResult<RwaListings>>;
  getEvidence(scope: ResourceScope, input?: any): Promise<RwaResult<RwaEvidence>>;
}

// ---- Implementation (Additive, Phase 3) ----
export class RwaIntelligenceProvider implements RwaIntelligenceProviderContract {
  
  /**
   * Retrieves the project state (real-time data) securely constrained by the ResourceScope.
   * This will replace the direct `dataProviderSingleton.getProjectState` in Hermes cognitive tools.
   */
  async getProjectState(scope: ResourceScope, input?: { slug?: string }): Promise<RwaResult<RwaProjectState>> {
    try {
      if (!scope.canonicalOrgId) {
        return { status: 'UNAUTHORIZED', reason: 'Missing canonical organization ID' };
      }

      const { projects } = await import('@saasfly/db-core');
      let targetProjectId = scope.projectId;

      // 1. Resolve and Authorize Target Project
      if (input?.slug) {
        const [proj] = await db.select({ id: projects.id, organizationId: projects.organizationId })
          .from(projects)
          .where(eq(projects.slug, input.slug))
          .limit(1);

        if (!proj) {
          return { status: 'UNAVAILABLE', reason: 'Project not found' };
        }
        if (proj.organizationId !== scope.canonicalOrgId) {
          return { status: 'UNAUTHORIZED', reason: 'Project does not belong to authorized organization' };
        }
        targetProjectId = proj.id;
      }

      if (!targetProjectId) {
        return { status: 'UNAVAILABLE', reason: 'No project ID resolvable in scope' };
      }

      // 2. Fetch Project using the existing DataProvider logic but bounded by the authorized slug
      const { dataProviderSingleton } = await import('@saasfly/hermes-core');
      const [proj] = await db.select({ slug: projects.slug })
        .from(projects)
        .where(eq(projects.id, targetProjectId))
        .limit(1);

      if (!proj) {
        return { status: 'UNAVAILABLE', reason: 'Project ID not found' };
      }

      const rawState = await dataProviderSingleton.getProjectState(proj.slug);
      if (!rawState) {
        return { status: 'UNAVAILABLE', reason: 'Failed to compute project state' };
      }

      return {
        status: 'SUCCESS',
        data: {
          title: rawState.title,
          slug: rawState.slug,
          currentPrice: rawState.metadata?.tokenPrice ?? 0,
          phaseName: rawState.metadata?.phaseName ?? 'Unknown',
          availableUnits: rawState.metadata?.availableUnits ?? 0,
          progressPercentage: rawState.metadata?.progressPercentage ?? 0,
          treasury: rawState.treasuryDisplay ?? '0',
          holdersCount: rawState.holdersCount ?? 0,
        }
      };
    } catch (e) {
      console.error('[RwaIntelligenceProvider] getProjectState failed:', e);
      return { status: 'UNAVAILABLE', reason: 'DB_READ_FAILED' };
    }
  }

  async getPhases(scope: ResourceScope, input?: { slug?: string }): Promise<RwaResult<RwaPhasesResult>> {
    try {
      if (!scope.canonicalOrgId) {
        return { status: 'UNAUTHORIZED', reason: 'Missing canonical organization ID' };
      }

      const { projects } = await import('@saasfly/db-core');
      let targetProjectId = scope.projectId;

      if (input?.slug) {
        const [proj] = await db.select({ id: projects.id, organizationId: projects.organizationId })
          .from(projects)
          .where(eq(projects.slug, input.slug))
          .limit(1);

        if (!proj) {
          return { status: 'UNAVAILABLE', reason: 'Project not found' };
        }
        if (proj.organizationId !== scope.canonicalOrgId) {
          return { status: 'UNAUTHORIZED', reason: 'Project does not belong to authorized organization' };
        }
        targetProjectId = proj.id;
      }

      if (!targetProjectId) {
        return { status: 'UNAVAILABLE', reason: 'No project ID resolvable in scope' };
      }

      const [proj] = await db.select().from(projects).where(eq(projects.id, targetProjectId)).limit(1);
      if (!proj) {
        return { status: 'UNAVAILABLE', reason: 'Project ID not found' };
      }

      // Delegate to existing live phase data provider for Phase 3
      const { getLivePhaseData } = await import('@saasfly/hermes-core');
      const liveData = await getLivePhaseData(proj);
      
      return {
        status: 'SUCCESS',
        data: liveData
      };
    } catch (e) {
      console.error('[RwaIntelligenceProvider] getPhases failed:', e);
      return { status: 'UNAVAILABLE', reason: 'DB_READ_FAILED' };
    }
  }

  async getPortfolio(scope: ResourceScope, input?: any): Promise<RwaResult<RwaPortfolio>> {
    return { status: 'UNAVAILABLE', reason: 'Not implemented in Phase 3' };
  }

  async getPurchaseHistory(scope: ResourceScope, input?: any): Promise<RwaResult<RwaPurchaseHistory>> {
    return { status: 'UNAVAILABLE', reason: 'Not implemented in Phase 3' };
  }

  async getPosition(scope: ResourceScope, input?: any): Promise<RwaResult<RwaPosition>> {
    return { status: 'UNAVAILABLE', reason: 'Not implemented in Phase 3' };
  }

  async getNav(scope: ResourceScope, input?: any): Promise<RwaResult<RwaNav>> {
    return { status: 'UNAVAILABLE', reason: 'Not implemented in Phase 3' };
  }

  async getGovernanceStatus(scope: ResourceScope, input?: any): Promise<RwaResult<RwaGovernanceStatus>> {
    return { status: 'UNAVAILABLE', reason: 'Not implemented in Phase 3' };
  }

  async getListings(scope: ResourceScope, input?: any): Promise<RwaResult<RwaListings>> {
    return { status: 'UNAVAILABLE', reason: 'Not implemented in Phase 3' };
  }

  async getEvidence(scope: ResourceScope, input?: any): Promise<RwaResult<RwaEvidence>> {
    return { status: 'UNAVAILABLE', reason: 'Not implemented in Phase 3' };
  }
}
