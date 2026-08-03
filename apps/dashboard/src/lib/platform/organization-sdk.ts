/**
 * 🏛️ Organization SDK — OrganizationContext Resolver
 * lib/platform/organization-sdk.ts
 *
 * Single entry point to resolve ALL context about an organization (project)
 * and its installed products. Runtime, Portal, and Studios should call this
 * instead of querying multiple tables independently.
 *
 * 🔒 S'Narai Protection: projectId=2 is read-only from this SDK.
 *    The SDK never mutates projects data.
 */

import { db } from '@/db';
import { projects, installedProducts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  PRODUCT_REGISTRY,
  ProductKey,
  PlanKey,
  getVisibleModules,
  getDefaultCapabilities,
  getDefaultConnectors,
} from './product-registry';

// ── Types ────────────────────────────────────────────────────────────────────

export interface InstalledProductContext {
  id: string;
  product: string;
  productFamily: string;
  plan: PlanKey;
  status: string;
  capabilities: Record<string, boolean>;
  connectors: Record<string, boolean | Record<string, string>>;
  config: Record<string, unknown>;
  runtimeManifest: Record<string, unknown>;
  visibleModules: string[];
  trialEndsAt: Date | null;
  activatedAt: Date | null;
}

export interface OrganizationContext {
  // Identity (from projects table)
  projectId: number;
  slug: string;
  name: string;
  logoUrl: string | null;

  // All installed products for this org
  installedProducts: InstalledProductContext[];

  // Active product context (resolved by productKey parameter)
  activeProduct: InstalledProductContext | null;

  // Convenience accessors (delegates to activeProduct)
  capabilities: Record<string, boolean>;
  connectors: Record<string, boolean | Record<string, string>>;
  config: Record<string, unknown>;
  runtimeManifest: Record<string, unknown>;
  visibleModules: string[];
  plan: PlanKey;
  status: string;
}

// ── SDK ───────────────────────────────────────────────────────────────────────

export const OrganizationSDK = {

  /**
   * Resolve full organization context for a given project and optional product.
   *
   * Usage:
   *   const ctx = await OrganizationSDK.resolve(projectId, 'HERMES');
   *   ctx.capabilities.voice  // → true/false based on plan
   *   ctx.visibleModules       // → ['intelligence', 'knowledge', 'channels']
   *   ctx.runtimeManifest      // → snapshot for agent runtime
   */
  async resolve(projectId: number, productKey?: ProductKey): Promise<OrganizationContext> {
    // 1. Load project (= Organization)
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { id: true, slug: true, title: true, logoUrl: true },
    });

    if (!project) {
      throw new Error(`[OrganizationSDK] Project not found: ${projectId}`);
    }

    // 2. Load all installed products for this project
    const rawProducts = await db.query.installedProducts.findMany({
      where: eq(installedProducts.projectId, projectId),
    });

    // 3. Map to InstalledProductContext (enrich with visible modules)
    const enrichedProducts: InstalledProductContext[] = rawProducts.map(p => {
      const caps = (p.capabilities as Record<string, boolean>) || {};
      const visibleMods = (p.product in PRODUCT_REGISTRY)
        ? getVisibleModules(p.product as ProductKey, caps)
        : [];

      return {
        id: p.id,
        product: p.product,
        productFamily: p.productFamily,
        plan: p.plan as PlanKey,
        status: p.status,
        capabilities: caps,
        connectors: (p.connectors as Record<string, boolean | Record<string, string>>) || {},
        config: (p.config as Record<string, unknown>) || {},
        runtimeManifest: (p.runtimeManifest as Record<string, unknown>) || {},
        visibleModules: visibleMods,
        trialEndsAt: p.trialEndsAt,
        activatedAt: p.activatedAt,
      };
    });

    // 4. Resolve active product
    const activeProduct = productKey
      ? enrichedProducts.find(p => p.product === productKey) ?? null
      : enrichedProducts[0] ?? null;

    return {
      projectId: project.id,
      slug: project.slug,
      name: project.title,
      logoUrl: project.logoUrl ?? null,
      installedProducts: enrichedProducts,
      activeProduct,
      // Convenience accessors
      capabilities:    activeProduct?.capabilities    ?? {},
      connectors:      activeProduct?.connectors      ?? {},
      config:          activeProduct?.config          ?? {},
      runtimeManifest: activeProduct?.runtimeManifest ?? {},
      visibleModules:  activeProduct?.visibleModules  ?? [],
      plan:            (activeProduct?.plan ?? 'sandbox') as PlanKey,
      status:          activeProduct?.status ?? 'trial',
    };
  },

  /**
   * Resolve organization context from a portal session token.
   * Used by the Client Portal to load the right product without exposing projectId.
   */
  async resolveFromSessionToken(sessionToken: string): Promise<OrganizationContext | null> {
    const product = await db.query.installedProducts.findFirst({
      where: eq(installedProducts.portalSessionToken, sessionToken),
    });

    if (!product) return null;

    return OrganizationSDK.resolve(product.projectId, product.product as ProductKey);
  },

  /**
   * Check whether a capability is active for an installed product.
   * Shorthand for ctx.capabilities[capability] === true.
   */
  async hasCapability(projectId: number, product: ProductKey, capability: string): Promise<boolean> {
    const installed = await db.query.installedProducts.findFirst({
      where: and(
        eq(installedProducts.projectId, projectId),
        eq(installedProducts.product, product)
      ),
      columns: { capabilities: true },
    });

    if (!installed) return false;
    return (installed.capabilities as Record<string, boolean>)[capability] === true;
  },

  /**
   * Build default capabilities and connectors for a fresh product installation.
   * Used by Provisioning Engine.
   */
  buildInstallDefaults(product: ProductKey, plan: PlanKey) {
    return {
      capabilities: getDefaultCapabilities(product, plan),
      connectors:   getDefaultConnectors(product, plan),
    };
  },
};
