import { db } from '@/db';
import { purchases, projects as projectsSchema } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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
          eq(purchases.status, 'on_hold')
        )
      });

      if (!onHoldPurchases.length) return 0;

      // Extract real crypto price instead of defaulting to 50
      let price = Number(project?.tokenPriceUsd);
      if (!price || price <= 0) {
          const phases = project?.w2eConfig?.phases || [];
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
    
    // Calculate progress relative to true crypto target
    let price = Number(project?.tokenPriceUsd);
    if (!price || price <= 0) {
        const phases = project?.w2eConfig?.phases || [];
        price = Number(phases[0]?.tokenPrice) || 0.0005; 
    }

    let targetAmount = Number(project.targetAmount || 0);
    if (targetAmount <= 0) {
        targetAmount = Number(project?.w2eConfig?.tokenomics?.targetUsd || 0);
    }
    
    // If we have a targetAmount in USD, calculate units. If not, use maxSupply from tokenomics
    let totalCapUnits = targetAmount > 0 ? Math.floor(targetAmount / price) : 0;
    if (totalCapUnits <= 0) {
        totalCapUnits = Number(project?.w2eConfig?.tokenomics?.maxSupply || 100000);
    }

    return {
      onChainUnits: onChainSupply,
      onHoldUnits: onHoldUnits,
      totalSoldUnits,
      availableUnits: Math.max(0, totalCapUnits - totalSoldUnits),
      progressPercentage: totalCapUnits > 0 ? Math.min(100, Math.round((totalSoldUnits / totalCapUnits) * 100)) : 0
    };
  }
}
