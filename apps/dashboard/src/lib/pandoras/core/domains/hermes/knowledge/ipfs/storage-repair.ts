/**
 * 🛠️ Pandora's Sovereign Storage Durability Repair Engine
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/storage-repair.ts
 *
 * Implements Phase A Hardening: Fail-Safe Business + Fail-Closed Legal Evidence
 * Reconciles and repairs any legal agreement or purchase where IPFS was temporarily
 * offline during initial approval, transitioning state from PENDING/DEGRADED to DURABLE.
 */

import { db } from '@/db';
import { purchases, projects } from '@/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { SovereignIpfsOrchestrator } from './orchestrator';

export interface RepairResult {
  totalScanned: number;
  repairedCount: number;
  failedCount: number;
  details: Array<{
    purchaseId: string;
    status: 'REPAIRED' | 'FAILED' | 'SKIPPED';
    cid?: string;
    error?: string;
  }>;
}

export class SovereignStorageRepairEngine {
  private orchestrator: SovereignIpfsOrchestrator;

  constructor(customOrchestrator?: SovereignIpfsOrchestrator) {
    this.orchestrator = customOrchestrator || new SovereignIpfsOrchestrator();
  }

  /**
   * Scans and repairs all purchases with PENDING or DEGRADED legal evidence.
   */
  public async repairPendingLegalAgreements(limit = 50): Promise<RepairResult> {
    const pendingPurchases = await db.query.purchases.findMany({
      where: or(
        sql`metadata->>'legalEvidenceStatus' = 'PENDING'`,
        sql`metadata->>'replicationStatus' = 'DEGRADED'`,
        sql`metadata->>'ipfsCid' IS NULL AND status = 'completed'`
      ),
      limit,
    });

    const result: RepairResult = {
      totalScanned: pendingPurchases.length,
      repairedCount: 0,
      failedCount: 0,
      details: [],
    };

    for (const purchase of pendingPurchases) {
      try {
        const project = await db.query.projects.findFirst({
          where: eq(projects.id, purchase.projectId),
        });

        if (!project) {
          result.details.push({
            purchaseId: purchase.purchaseId,
            status: 'SKIPPED',
            error: `Project ${purchase.projectId} not found`,
          });
          continue;
        }

        const units = Number(purchase.amount);
        const agreementContent = `Investor Participation & Digital Certificate Agreement v2.0 - Project: ${project.title} - Purchase: ${purchase.purchaseId} - User: ${purchase.userId} - Units: ${units}`;
        const agreementHash = crypto.createHash('sha256').update(agreementContent).digest('hex');

        const pinResult = await this.orchestrator.pinJson({
          title: `Digital Participation Agreement — ${project.title}`,
          projectSlug: project.slug,
          purchaseId: purchase.purchaseId,
          targetWallet: purchase.userId || null,
          units,
          agreementContent,
          agreementHash,
          certifiedAt: new Date().toISOString(),
          repairedAt: new Date().toISOString(),
        }, {
          name: `legal_agreement_${project.slug}_${purchase.purchaseId}.json`,
          category: 'LEGAL_AGREEMENT',
        });

        const currentMeta = typeof purchase.metadata === 'object' && purchase.metadata !== null ? purchase.metadata : {};
        const updatedMeta = {
          ...currentMeta,
          legalEvidenceStatus: pinResult.replicationStatus === 'DURABLE' ? 'DURABLE' : 'ANCHORED',
          ipfsCid: pinResult.cid,
          backupIpfsCid: pinResult.backupCid,
          ipfsUri: `ipfs://${pinResult.cid}`,
          durabilityProof: pinResult.durabilityProof,
          replicationStatus: pinResult.replicationStatus,
          lastRepairedAt: new Date().toISOString(),
        };

        await db.update(purchases)
          .set({
            metadata: updatedMeta,
            agreementHash,
            updatedAt: new Date(),
          })
          .where(eq(purchases.id, purchase.id));

        result.repairedCount++;
        result.details.push({
          purchaseId: purchase.purchaseId,
          status: 'REPAIRED',
          cid: pinResult.cid,
        });
      } catch (err: any) {
        result.failedCount++;
        result.details.push({
          purchaseId: purchase.purchaseId,
          status: 'FAILED',
          error: err?.message || 'Repair pinning failed',
        });
      }
    }

    return result;
  }
}
