import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface ProjectState {
  title: string;
  slug: string;
  currentSupply?: number;
  userBalance?: number;
  userVotingPower?: number;
  userRewards?: number;
  certificates?: any[];
  governance?: any[];
  metadata?: {
    tokenPrice?: number;
    progressPercentage?: number;
    soldUnits?: number;
    availableUnits?: number;
    phaseName?: string;
  };
  holdersCount?: number;
  treasuryDisplay?: string;
}

export interface DataProvider {
  getProjectState(slug: string, walletAddress?: string): Promise<ProjectState | null>;
  getInventory?(slug: string): Promise<any>;
}

export class PandorasDataProvider implements DataProvider {
  async getProjectState(slug: string, walletAddress?: string): Promise<ProjectState | null> {
    try {
      const { ProjectDomainService } = await import('@/lib/domain/project-domain-service');
      const domain = await ProjectDomainService.buildProjectDomain(slug);
      
      if (!domain || !domain.project) {
        const project = await db.query.projects.findFirst({
          where: eq(projects.slug, slug)
        });
        if (!project) return null;
        const p = project as any;
        const config = typeof p.w2eConfig === 'string' ? JSON.parse(p.w2eConfig || '{}') : (p.w2eConfig || {});

        return {
          title: p.title,
          slug: p.slug,
          metadata: {
            tokenPrice: Number(p.tokenPriceUsd || config.tokenPrice || 0),
            progressPercentage: Number(config.progressPercentage || 0),
            soldUnits: Number(config.soldUnits || 0),
            availableUnits: Number(config.availableUnits || 0),
            phaseName: config.currentPhaseName || 'Fase 1'
          },
          holdersCount: Number(config.holdersCount || 0),
          treasuryDisplay: `$${Number(config.treasuryBalance || 0).toLocaleString()} USD`
        };
      }

      const raw = domain.project as any;
      const config = typeof raw.w2eConfig === 'string' ? JSON.parse(raw.w2eConfig || '{}') : (raw.w2eConfig || {});

      // Calculate real-time phase stats dynamically using InventoryService and phase utils
      let progressPercentage = Number(config.progressPercentage || raw.progressPercentage || 0);
      let soldUnits = Number(raw.soldUnits || config.soldUnits || 0);
      let availableUnits = Number(raw.availableUnits || config.availableUnits || 0);
      let activePhaseName = raw.currentPhaseName || config.currentPhaseName || 'Fase 1';
      let activeTokenPrice = Number(raw.tokenPriceUsd || config.tokenPrice || 0);

      try {
        const { getProjectPhasesWithStats } = await import('@/lib/phase-utils');
        const currentSupply = Number(raw.currentSupply || config.currentSupply || 0);
        const phasesWithStats = getProjectPhasesWithStats(raw, currentSupply);
        if (phasesWithStats && phasesWithStats.length > 0) {
          const currentPhase = phasesWithStats.find((p: any) => p.stats && !p.stats.isSoldOut) || phasesWithStats[0];
          if (currentPhase) {
            activePhaseName = currentPhase.name || activePhaseName;
            activeTokenPrice = currentPhase.tokenPrice || activeTokenPrice;
            if (currentPhase.stats) {
              soldUnits = currentPhase.stats.tokensSold || soldUnits;
              availableUnits = currentPhase.stats.remainingTokens || availableUnits;
              progressPercentage = currentPhase.stats.percent || progressPercentage;
            }
          }
        }
      } catch (calcErr) {
        console.warn('[PandorasDataProvider] Phase stats calculation fallback:', calcErr);
      }

      return {
        title: raw.title,
        slug: raw.slug,
        metadata: {
          tokenPrice: activeTokenPrice,
          progressPercentage,
          soldUnits,
          availableUnits,
          phaseName: activePhaseName
        },
        holdersCount: Number(raw.holdersCount || config.holdersCount || 0),
        treasuryDisplay: `$${Number(raw.treasuryBalance || config.treasuryBalance || 0).toLocaleString()} USD`
      };
    } catch (err) {
      console.error('[PandorasDataProvider] Error fetching project state:', err);
      return null;
    }
  }
}

export const dataProviderSingleton = new PandorasDataProvider();
