/**
 * 🏛️ Tenant Provisioning Boundary Service
 * src/lib/provisioning/tenant-provisioning.service.ts
 *
 * Core domain service responsible for transactional, idempotent,
 * and product-aware tenant onboarding and modular installation.
 */

import { db } from '@/db';
import { projects, installedProducts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type {
  ProvisioningRequestDTO,
  ProvisioningResponseDTO,
  OnboardingProductKey,
} from '@/lib/dash-contracts/provisioning';

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'portal',
  'nexus',
  'onboarding',
  'auth',
  'profile',
  'settings',
  'ecosystem',
  'growth-os',
  'rwa',
  'dashboard',
]);

const VALID_BUSINESS_CATEGORIES = new Set([
  'residential_real_estate',
  'commercial_real_estate',
  'tech_startup',
  'renewable_energy',
  'art_collectibles',
  'intellectual_property',
  'defi',
  'gaming',
  'metaverse',
  'music_audio',
  'sports_fan_tokens',
  'education',
  'healthcare',
  'supply_chain',
  'infrastructure',
  'social_networks',
  'carbon_credits',
  'insurance',
  'prediction_markets',
  'other',
] as const);

export type ValidBusinessCategory = typeof VALID_BUSINESS_CATEGORIES extends Set<infer T> ? T : 'other';

export class TenantProvisioningService {
  /**
   * Cleans and sanitizes an organization slug
   */
  public sanitizeSlug(rawSlug: string): string {
    return rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Normalizes business category to valid database enum
   */
  public normalizeBusinessCategory(cat?: string | null): ValidBusinessCategory {
    if (!cat) return 'tech_startup';
    const lower = cat.toLowerCase().trim();
    if (VALID_BUSINESS_CATEGORIES.has(lower as any)) {
      return lower as ValidBusinessCategory;
    }
    if (lower === 'technology') return 'tech_startup';
    if (lower === 'real_estate') return 'commercial_real_estate';
    if (lower === 'finance') return 'defi';
    return 'other';
  }

  /**
   * Validates wallet address format
   */
  public isValidWalletAddress(address?: string | null): boolean {
    if (!address || typeof address !== 'string') return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
  }

  /**
   * Provision tenant identity and installed products within an idempotent sequence
   */
  async provisionTenant(
    req: ProvisioningRequestDTO,
    actorWallet: string
  ): Promise<ProvisioningResponseDTO> {
    // 1. Strict Authentication & Actor Validation (Fail-Closed)
    if (!this.isValidWalletAddress(actorWallet)) {
      throw new Error('UNAUTHORIZED_ACTOR: A valid connected wallet address is required to provision a tenant.');
    }

    const cleanWallet = actorWallet.toLowerCase().trim();

    // 2. Validate & Sanitize Input DTO
    if (!req.organization?.name || req.organization.name.trim().length === 0) {
      throw new Error('INVALID_ORGANIZATION_NAME: Organization name is required.');
    }

    const cleanSlug = this.sanitizeSlug(req.organization.slug || req.organization.name);
    if (!cleanSlug || cleanSlug.length < 2) {
      throw new Error('INVALID_ORGANIZATION_SLUG: Slug must be at least 2 characters.');
    }

    if (RESERVED_SLUGS.has(cleanSlug)) {
      throw new Error(`RESERVED_SLUG_CONFLICT: Slug '${cleanSlug}' is a reserved system keyword.`);
    }

    const productsToInstall: OnboardingProductKey[] = Array.isArray(req.products) && req.products.length > 0
      ? Array.from(new Set(req.products))
      : ['HERMES']; // Default to Hermes if no product specified

    const idempotencyKey = req.idempotencyKey?.trim() || `idem_${cleanSlug}_${Date.now()}`;
    const businessCat = this.normalizeBusinessCategory(req.organization.businessCategory);

    // 3. Idempotency & Conflict Check
    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, cleanSlug))
      .limit(1)
      .then((rows) => rows[0]);

    if (existingProject) {
      const isOwner = existingProject.applicantWalletAddress?.toLowerCase() === cleanWallet;
      if (!isOwner) {
        throw new Error(`TENANT_SLUG_CONFLICT: Slug '${cleanSlug}' is already registered by another organization.`);
      }

      // Check if this is an idempotent replay
      const extra = typeof existingProject.extraConfig === 'object' && existingProject.extraConfig !== null
        ? (existingProject.extraConfig as Record<string, any>)
        : {};

      const existingInstalled = await db
        .select()
        .from(installedProducts)
        .where(eq(installedProducts.projectId, existingProject.id));

      if (extra.idempotencyKey === idempotencyKey && existingInstalled.length > 0) {
        return {
          success: true,
          organizationId: `org_${cleanSlug}`,
          organizationSlug: cleanSlug,
          organizationName: existingProject.title,
          installedProducts: existingInstalled.map((p) => ({
            id: typeof p.id === 'number' ? p.id : 1,
            productFamily: p.productFamily,
            plan: p.plan,
            status: p.status,
          })),
          redirectUrl: `/ecosystem/${cleanSlug}`,
          isIdempotentReplay: true,
        };
      }
    }

    let projectId: number;
    let orgTitle = req.organization.name.trim();
    let wasCreated = false;

    try {
      if (existingProject) {
        projectId = existingProject.id;
        orgTitle = existingProject.title;
      } else {
        const [insertedProject] = await db
          .insert(projects)
          .values({
            title: orgTitle,
            slug: cleanSlug,
            description: req.organization.description || `${orgTitle} Sovereign Organization`,
            businessCategory: businessCat,
            website: req.organization.website || null,
            applicantName: orgTitle,
            applicantWalletAddress: cleanWallet,
            applicantEmail: req.organization.applicantEmail || null,
            applicantPhone: req.organization.applicantPhone || null,
            status: 'approved',
            isDeleted: false,
            extraConfig: {
              idempotencyKey,
              provisionedAt: new Date().toISOString(),
              provisionedBy: cleanWallet,
              initialProducts: productsToInstall,
              intents: req.intents || {},
            },
          })
          .returning({ id: projects.id });

        if (!insertedProject) {
          throw new Error('PROVISIONING_FAILED: Failed to create tenant project identity.');
        }
        projectId = insertedProject.id;
        wasCreated = true;
      }

      // 4. Modular Product Installation
      const installedProductResults: any[] = [];
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      for (const productKey of productsToInstall) {
        let productFamily = 'GROWTH_OS';
        let productRecordName = 'GROWTH_OS';

        if (productKey === 'HERMES') {
          productFamily = 'HERMES';
          productRecordName = 'HERMES';
        } else if (productKey === 'PANDORAS_RWA') {
          productFamily = 'CAPITAL';
          productRecordName = 'TOKENIZATION';
        } else {
          productFamily = 'GROWTH_OS';
          productRecordName = 'GROWTH_OS';
        }

        // Check if product record already exists
        const [existingProd] = await db
          .select()
          .from(installedProducts)
          .where(
            sql`${installedProducts.projectId} = ${projectId} AND ${installedProducts.productFamily} = ${productFamily}`
          )
          .limit(1);

        if (!existingProd) {
          const [newProd] = await db
            .insert(installedProducts)
            .values({
              projectId,
              product: productRecordName,
              productFamily,
              plan: 'starter',
              status: 'trial',
              bindingMode: 'provisioned',
              hermesInstanceId: `hermes_inst_${projectId}`,
              capabilities: {},
              connectors: {},
              config: {
                provisionedAt: new Date().toISOString(),
                trialEndsAt,
                initialIntent:
                  productKey === 'HERMES'
                    ? req.intents?.hermesPriority
                    : productKey === 'GROWTH_OS'
                    ? req.intents?.growthPriority
                    : req.intents?.rwaPriority || null,
              },
              runtimeManifest: {},
            })
            .returning();

          if (newProd) {
            installedProductResults.push(newProd);
          }
        } else {
          installedProductResults.push(existingProd);
        }
      }

      return {
        success: true,
        organizationId: `org_${cleanSlug}`,
        organizationSlug: cleanSlug,
        organizationName: orgTitle,
        installedProducts: installedProductResults.map((p, idx) => ({
          id: typeof p.id === 'number' ? p.id : idx + 1,
          productFamily: p.productFamily,
          plan: p.plan,
          status: p.status,
          trialEndsAt,
        })),
        redirectUrl: `/ecosystem/${cleanSlug}`,
        isIdempotentReplay: false,
      };
    } catch (err) {
      if (wasCreated && projectId!) {
        // Compensating cleanup on partial failure
        try {
          await db.delete(installedProducts).where(eq(installedProducts.projectId, projectId));
          await db.delete(projects).where(eq(projects.id, projectId));
        } catch (cleanupErr) {
          console.error('[TenantProvisioningService] Cleanup error after failure:', cleanupErr);
        }
      }
      throw err;
    }
  }
}

export const tenantProvisioningService = new TenantProvisioningService();
