import { db } from '@/db';
import { purchases, projects as projectsSchema } from '@/db/schema';
import { eq, and, sql, or } from 'drizzle-orm';
import { getRawPhases } from '../phase-utils';

/**
 * 📊 Effective Supply Service
 * ============================================================================
 * Calculates the "Real" availability of a project's inventory by combining:
 * 1. On-Chain Supply: Units already minted/transferred.
 * 2. On-Hold Reservations: DB records for bank transfers awaiting approval.
 * ============================================================================
 */
export class InventoryService {
  /**
   * Returns the count of units currently in 'on_hold' status for a project.
   */
  static async getOnHoldCount(project: any): Promise<number> {
    try {
      const onHoldPurchases = await db.query.purchases.findMany({
        where: and(
          eq(purchases.projectId, project.id),
          or(
            eq(purchases.status, 'on_hold'),
            eq(purchases.status, 'processing')
          )
        )
      });

      if (!onHoldPurchases.length) return 0;

      // Extract real crypto price instead of defaulting to 50
      let price = Number(project?.tokenPriceUsd);
      if (!price || price <= 0) {
          const phases = getRawPhases(project);
          price = Number(phases[0]?.tokenPrice) || 0.0005; 
      }
      
      let totalUnits = 0;
      for (const p of onHoldPurchases) {
        const units = Math.floor(Number(p.amount) / price);
        totalUnits += units > 0 ? units : 1; 
      }

      return totalUnits;
    } catch (error) {
      console.error('[InventoryService] Error calculating onHoldCount:', error);
      return 0;
    }
  }

  static async getEffectiveMetrics(project: any, onChainSupply: number) {
    const onHoldUnits = await this.getOnHoldCount(project);
    const totalSoldUnits = onChainSupply + onHoldUnits;
    
    let totalCapUnits = 0;
    const phases = getRawPhases(project);
    if (phases && phases.length > 0) {
        totalCapUnits = phases.reduce((acc: number, phase: any) => {
            return acc + Number(phase.tokenAllocation || phase.allocation || phase.limit || phase.maxSupply || 0);
        }, 0);
    }
    
    // Fallbacks if phases don't define token allocation
    if (totalCapUnits <= 0) {
        let price = Number(project?.tokenPriceUsd);
        if (!price || price <= 0) {
            price = Number(phases[0]?.tokenPrice) || 0.0005; 
        }

        let targetAmount = Number(project.targetAmount || 0);
        if (targetAmount <= 0) {
            targetAmount = Number(project?.w2eConfig?.tokenomics?.targetUsd || 0);
        }
        
        totalCapUnits = (targetAmount > 0 && price > 0) ? Math.floor(targetAmount / price) : 0;
    }

    if (totalCapUnits <= 0) {
        totalCapUnits = Number(project?.w2eConfig?.tokenomics?.maxSupply || 100000);
    }

    return {
      onChainUnits: onChainSupply,
      onHoldUnits: onHoldUnits,
      totalSoldUnits,
      availableUnits: Math.max(0, totalCapUnits - totalSoldUnits),
      progressPercentage: totalCapUnits > 0 ? Math.min(100, Number(((totalSoldUnits / totalCapUnits) * 100).toFixed(2))) : 0
    };
  }
}
