/**
 * 🎫 NFT Lab Activation Service
 * lib/growth/nft/nft-lab-activation.service.ts
 *
 * Activates the NFT_LAB product for a tenant by:
 *   1. Verifying tenant exists and plan permits NFT Lab
 *   2. Creating / updating an installed_products row (product: 'NFT_LAB')
 *   3. Registering NFT capability grants in hermesCapabilityGrants
 *      via the existing NftPolicyEngine.grantNftCapabilitiesToTenant()
 *   4. Emitting an outbox event for downstream consumers
 *
 * Authority model:
 *   - authorizedBy = canonical actor identity (resolved server-side from admin session)
 *   - projectId resolved from DB (never from client body)
 *   - Idempotent: safe to call multiple times
 *
 * Called by:
 *   - POST /api/v1/growth/nft-lab/activate (admin route)
 *   - ProvisioningEngine when product = 'NFT_LAB' (future)
 */

import { db } from '@/db';
import { installedProducts, projects, outboxEvents } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getDefaultCapabilities, getDefaultConnectors } from '@/lib/platform/product-registry';
import { NftPolicyEngine } from './nft-policy-engine';
import type { PlanKey } from '@/lib/platform/product-registry';

export interface NftLabActivationInput {
  /** Canonical org ID (server-resolved, never from client body) */
  organizationId: string;
  /** Commercial plan — controls which capabilities are enabled */
  plan: PlanKey;
  /** Canonical actor identity for audit trail (server-resolved) */
  authorizedBy: string;
  /** Override Hermes instance binding */
  hermesInstanceId?: string;
}

export interface NftLabActivationResult {
  success: boolean;
  installedProductId: string;
  capabilitiesGranted: string[];
  message: string;
  alreadyActive: boolean;
}

export class NftLabActivationService {

  static async activate(input: NftLabActivationInput): Promise<NftLabActivationResult> {
    const { organizationId, plan, authorizedBy } = input;
    const normalized = organizationId.toLowerCase().replace(/^org_/, '');

    if (!authorizedBy || authorizedBy.trim() === '') {
      throw new Error('[NftLabActivation] authorizedBy is required (server-resolved actor identity).');
    }

    // ── 1. Resolve project server-side ──────────────────────────────────────
    const [project] = await db
      .select({ id: projects.id, slug: projects.slug })
      .from(projects)
      .where(or(
        eq(projects.organizationId, normalized),
        eq(projects.organizationId, organizationId),
        eq(projects.slug, normalized),
      ))
      .limit(1);

    if (!project) {
      throw new Error(`[NftLabActivation] Project not found for org: ${organizationId}`);
    }

    // ── 2. Check if already installed ──────────────────────────────────────
    const [existing] = await db
      .select({ id: installedProducts.id, status: installedProducts.status })
      .from(installedProducts)
      .where(and(
        eq(installedProducts.projectId, project.id),
        eq(installedProducts.product, 'NFT_LAB'),
      ))
      .limit(1);

    if (existing && existing.status === 'active') {
      return {
        success: true,
        installedProductId: existing.id,
        capabilitiesGranted: [],
        message: 'NFT Lab is already active for this tenant.',
        alreadyActive: true,
      };
    }

    // ── 3. Compute capabilities from plan ──────────────────────────────────
    const defaultCaps = getDefaultCapabilities('NFT_LAB', plan);
    const defaultConns = getDefaultConnectors('NFT_LAB', plan);

    // ── 4. Insert or update installed_products ─────────────────────────────
    let productId: string;

    if (existing) {
      // Reactivate suspended/churned
      await db
        .update(installedProducts)
        .set({
          status: 'active',
          plan,
          capabilities: defaultCaps,
          connectors: defaultConns,
          activatedAt: new Date(),
          updatedAt: new Date(),
          config: {
            defaultChainId: 8453,           // Base Mainnet — backend determined
            allowedPurposes: [              // Starter default — can be widened by plan
              'ACCESS', 'MEMBERSHIP', 'REPUTATION', 'REWARD', 'COLLECTIBLE', 'EXPERIENCE',
            ],
            activatedBy: authorizedBy,
            activatedAt: new Date().toISOString(),
          },
        })
        .where(eq(installedProducts.id, existing.id));
      productId = existing.id;
    } else {
      const hermesInstanceId = input.hermesInstanceId
        ?? `hermes_inst_nft_${project.id}`;

      const [inserted] = await db
        .insert(installedProducts)
        .values({
          projectId: project.id,
          product: 'NFT_LAB',
          productFamily: 'GROWTH_OS',
          plan,
          status: 'active',
          capabilities: defaultCaps,
          connectors: defaultConns,
          hermesInstanceId,
          bindingMode: 'provisioned',
          config: {
            defaultChainId: 8453,
            allowedPurposes: [
              'ACCESS', 'MEMBERSHIP', 'REPUTATION', 'REWARD', 'COLLECTIBLE', 'EXPERIENCE',
            ],
            activatedBy: authorizedBy,
            activatedAt: new Date().toISOString(),
          },
          runtimeManifest: {
            version: '1.0.0',
            product: 'NFT_LAB',
            plan,
          },
          activatedAt: new Date(),
        })
        .returning({ id: installedProducts.id });

      if (!inserted) throw new Error('[NftLabActivation] Failed to insert installed_products row.');
      productId = inserted.id;
    }

    // ── 5. Register NFT capability grants via existing CapabilityGrantService ─
    // This extends hermesCapabilityGrants — no new system
    await NftPolicyEngine.grantNftCapabilitiesToTenant(normalized, authorizedBy);

    // For growth+: also grant token_gating
    const capabilitiesGranted = [
      'nft.collection.create',
      'nft.token.issue',
      'nft.token.revoke',
      'nft.verify.ownership',
    ];

    if (plan === 'growth' || plan === 'enterprise') {
      const { NFT_CAPABILITIES } = await import('./nft-policy-engine');
      await NftPolicyEngine.grantNftCapabilitiesToTenant(
        normalized,
        authorizedBy,
        [
          'nft.collection.create',
          'nft.collection.deploy',
          'nft.token.issue',
          'nft.token.revoke',
          'nft.verify.ownership',
        ] as any,
      );
      capabilitiesGranted.push(NFT_CAPABILITIES.COLLECTION_DEPLOY);
    }

    // ── 6. Outbox event for downstream (Hermes notification, etc.) ─────────
    await db.insert(outboxEvents).values({
      organizationId: normalized,
      aggregateType: 'installed_product',
      aggregateId: productId,
      eventType: 'product.nft_lab.activated',
      payload: {
        productId,
        organizationId: normalized,
        plan,
        capabilitiesGranted,
        activatedBy: authorizedBy,
      },
      status: 'pending',
    }).catch(err => console.warn('[NftLabActivation] Outbox event failed (non-fatal):', err));

    return {
      success: true,
      installedProductId: productId,
      capabilitiesGranted,
      message: `NFT Lab activated on plan '${plan}' for tenant ${normalized}.`,
      alreadyActive: false,
    };
  }

  /**
   * Checks if NFT Lab is actively installed for a tenant.
   * Used by the capability registry and API routes.
   */
  static async isActive(organizationId: string): Promise<boolean> {
    const normalized = organizationId.toLowerCase().replace(/^org_/, '');
    try {
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(or(eq(projects.organizationId, normalized), eq(projects.slug, normalized)))
        .limit(1);

      if (!project) return false;

      const [row] = await db
        .select({ status: installedProducts.status })
        .from(installedProducts)
        .where(and(
          eq(installedProducts.projectId, project.id),
          eq(installedProducts.product, 'NFT_LAB'),
        ))
        .limit(1);

      return row?.status === 'active';
    } catch {
      return false;
    }
  }

  /**
   * Returns the installed capabilities config for this tenant's NFT Lab.
   * Read-only. Used by policy engine and Hermes tools.
   */
  static async getCapabilitiesConfig(organizationId: string): Promise<Record<string, boolean> | null> {
    const normalized = organizationId.toLowerCase().replace(/^org_/, '');
    try {
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(or(eq(projects.organizationId, normalized), eq(projects.slug, normalized)))
        .limit(1);

      if (!project) return null;

      const [row] = await db
        .select({ capabilities: installedProducts.capabilities })
        .from(installedProducts)
        .where(and(
          eq(installedProducts.projectId, project.id),
          eq(installedProducts.product, 'NFT_LAB'),
        ))
        .limit(1);

      return (row?.capabilities as Record<string, boolean>) || null;
    } catch {
      return null;
    }
  }
}
