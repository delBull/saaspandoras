
import { db } from "@saasfly/db-core";
import { purchases, projects } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { SNARAI_AGREEMENT_TEMPLATE } from "./snarai-agreement-template";
import * as cryptoNode from "crypto";

export interface AgreementData {
  projectName: string;
  walletAddress: string;
  tokenId: string;
  timestamp: string;
  agreementHash?: string;
}

export class LegalEngine {
  /**
   * Generates a deterministic SHA-256 hash for a given agreement text
   */
  static generateHash(content: string): string {
    return cryptoNode.createHash("sha256").update(content).digest("hex");
  }

  static getTemplate(project: any): string {
    const runtimeConfig = (project.tenantRuntimeConfig as any) || {};
    const legalProfile = runtimeConfig.legalProfile || {};
    
    const customTemplate = project.legalConfig?.agreementTemplate || legalProfile.agreementTemplate;
    if (customTemplate) return customTemplate;

    if (legalProfile.agreementTemplateName === 'SNARAI_AGREEMENT_TEMPLATE') {
      return SNARAI_AGREEMENT_TEMPLATE;
    }

    // Default Fallback Template (Generic version of the optimized one)
    return SNARAI_AGREEMENT_TEMPLATE.replace(/S'NARAI/g, project.title.toUpperCase());
  }

  /**
   * Processes a purchase to generate its legal metadata and integrity proof.
   */
  static async certifyPurchase(purchaseId: string, tokenId: string) {
    console.log(`[LegalEngine] 📜 Certifying purchase ${purchaseId} with TokenID ${tokenId}`);

    try {
      // 1. Fetch Purchase and Project
      const purchase = await db.query.purchases.findFirst({
        where: eq(purchases.purchaseId, purchaseId),
        with: {
          project: true
        } as any
      });

      if (!purchase || !purchase.projectId) {
        console.error(`[LegalEngine] ❌ Purchase not found or missing project: ${purchaseId}`);
        return;
      }

      // Re-fetch project to get full details if needed (since 'with' might be limited)
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, purchase.projectId)
      });

      if (!project) return;

      // 2. Prepare Metadata
      const timestamp = new Date(purchase.createdAt).toISOString();
      const walletAddress = purchase.userId; // Usually the wallet
      
      // 3. Resolve Template & Generate Hash
      const baseTemplate = this.getTemplate(project);
      
      // We do a two-pass replacement:
      // First pass for variables that contribute to the hash
      let agreementText = baseTemplate
        .replace(/{timestamp}/g, timestamp)
        .replace(/{token_id}/g, tokenId)
        .replace(/{wallet_address}/g, walletAddress)
        .replace(/{project_name}/g, project.title);

      // Generate the integrity hash of this specific document instance
      const agreementHash = this.generateHash(agreementText);

      // Second pass: Inject the hash into the text (for display)
      agreementText = agreementText.replace(/{agreement_hash}/g, agreementHash);

      // 4. Unique Agreement ID (Human Readable)
      const agreementId = `AG-${project.slug.toUpperCase().substring(0, 3)}-${tokenId.padStart(5, '0')}`;
      
      // We assume the portal is in the project's site under /portal (or /cert)
      const runtimeConfig = (project.tenantRuntimeConfig as any) || {};
      const brandConfig = runtimeConfig.brandConfig || {};
      const baseUrl = project.website || brandConfig.website || `https://${project.slug}.aztecaz.xyz`;
      const legalPortalUrl = `${baseUrl}/portal?wallet=${walletAddress}&cert=${agreementId}`;

      // 6. Update Database
      await db.update(purchases)
        .set({
          tokenId,
          agreementHash,
          agreementId,
          legalPortalUrl,
          updatedAt: new Date()
        })
        .where(eq(purchases.purchaseId, purchaseId));

      console.log(`[LegalEngine] ✅ Integrity Proof generated: ${agreementId} (${agreementHash.substring(0, 8)}...)`);
      
      return { agreementId, agreementHash, legalPortalUrl };

    } catch (error) {
      console.error(`[LegalEngine] ❌ Error certifying purchase:`, error);
    }
  }
}
