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
  static async getOnHoldCount(projectId: number): Promise<number> {
    try {
      // We assume each purchase record has an 'amount' field representing the total USD.
      // We need to resolve how many 'units' that represents based on the project's tokenPriceUsd.
      // For simplicity in the first iteration, we query the purchases and calculate units.
      
      const onHoldPurchases = await db.query.purchases.findMany({
        where: and(
          eq(purchases.projectId, projectId),
          eq(purchases.status, 'on_hold')
        )
      });

      if (!onHoldPurchases.length) return 0;

      // Fetch project to get current price if needed, 
      // but usually the purchase record should store units or we calculate here.
      // Assuming 1 unit = tokenPriceUsd.
      
      const project = await db.query.projects.findFirst({
        where: eq(projectsSchema.id, projectId)
      });
      
      const price = Number(project?.tokenPriceUsd || 50);
      
      let totalUnits = 0;
      for (const p of onHoldPurchases) {
        const units = Math.floor(Number(p.amount) / price);
        totalUnits += units > 0 ? units : 1; // Minimum 1 unit if record exists
      }

      return totalUnits;
    } catch (error) {
      console.error('[InventoryService] Error calculating onHoldCount:', error);
      return 0;
    }
  }

  /**
   * Returns a complete breakdown of the project's inventory.
   */
  static async getEffectiveMetrics(project: any, onChainSupply: number) {
    const onHoldUnits = await this.getOnHoldCount(project.id);
    const totalSoldUnits = onChainSupply + onHoldUnits;
    
    // Calculate progress relative to target
    const price = Number(project.tokenPriceUsd || 50);
    const targetAmount = Number(project.targetAmount || 0);
    const totalCapUnits = targetAmount > 0 ? Math.floor(targetAmount / price) : 100;

    return {
      onChainUnits: onChainSupply,
      onHoldUnits: onHoldUnits,
      totalSoldUnits,
      availableUnits: Math.max(0, totalCapUnits - totalSoldUnits),
      progressPercentage: totalCapUnits > 0 ? Math.min(100, Math.round((totalSoldUnits / totalCapUnits) * 100)) : 0
    };
  }
}
