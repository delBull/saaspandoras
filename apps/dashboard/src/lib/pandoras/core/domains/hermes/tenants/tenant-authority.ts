/**
 * 🏛️ HERMES OS — Tenant Authority Service (Milestone K27.1)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/tenants/tenant-authority.ts
 *
 * Enforces the Golden Invariant of Multi-Tenant Sovereignty:
 *   External Identity (Slug/UUID/ProjectId) → Canonical Tenant ID (UUID) → ControlPlaneContext → EVERY Downstream Operation
 *
 * Responsibilities:
 * 1. Single source of truth for canonical tenant resolution.
 * 2. Idempotent provisionTenantSovereignty(...) for external tenants.
 * 3. Bridges Knowledge Vault, IPFS Claim Contracts, Identity Souls, and Executable Journeys.
 */

import { db } from '@/db';
import { projects, hermesClaimContracts, hermesKnowledgeRegistry } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { TenantProvisioner } from './tenant-provisioner';
import { ensureTenantCanonicalJourney } from '../addons/catalog';
import { TenantIntelligenceProvisionInput, TenantProvisionResult } from './contracts';

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export interface CanonicalTenantIdentity {
  canonicalOrgId: string;
  projectSlug: string;
  projectId: number;
  title: string;
  status: string;
}

export interface SovereignTenantState {
  canonicalIdentity: CanonicalTenantIdentity;
  hasClaimContract: boolean;
  claimContractId?: string;
  ipfsCid?: string;
  hasExecutableJourney: boolean;
  provisionResult?: TenantProvisionResult;
  status: 'SOVEREIGN_READY' | 'PROVISIONING_REQUIRED' | 'DEGRADED';
}

export class TenantAuthorityService {
  /**
   * Resolves any external representation (slug, UUID, numeric ID) into a Canonical Tenant Identity.
   * Fail-closed: returns null if the tenant does not exist.
   */
  public static async resolveCanonicalTenant(identifier: string): Promise<CanonicalTenantIdentity | null> {
    if (!identifier || typeof identifier !== 'string') return null;
    const cleanId = identifier.trim();

    const [project] = await db
      .select({
        id: projects.id,
        slug: projects.slug,
        organizationId: projects.organizationId,
        title: projects.title,
        status: projects.status,
      })
      .from(projects)
      .where(
        or(
          eq(projects.slug, cleanId),
          ...(isUuid(cleanId) ? [eq(projects.organizationId, cleanId)] : []),
          ...(Number.isInteger(Number(cleanId)) ? [eq(projects.id, Number(cleanId))] : [])
        )
      )
      .limit(1);

    if (!project || !project.slug || !project.organizationId) {
      return null;
    }

    return {
      canonicalOrgId: project.organizationId,
      projectSlug: project.slug,
      projectId: project.id,
      title: project.title || project.slug,
      status: project.status || 'ACTIVE',
    };
  }

  /**
   * Fully provisions sovereign intelligence and operational authority for a tenant.
   * IDEMPOTENT: If already provisioned, refreshes artifacts safely without duplication.
   */
  public static async provisionTenantSovereignty(
    identifier: string,
    customInput?: Partial<TenantIntelligenceProvisionInput>
  ): Promise<SovereignTenantState> {
    const canonical = await this.resolveCanonicalTenant(identifier);
    if (!canonical) {
      throw new Error(`[TenantAuthority] Impossible to provision sovereignty: Tenant '${identifier}' not found.`);
    }

    // 1. Check existing Claim Contract
    const existingContracts = await db
      .select()
      .from(hermesClaimContracts)
      .where(
        or(
          eq(hermesClaimContracts.tenantId, canonical.canonicalOrgId),
          eq(hermesClaimContracts.tenantId, canonical.projectSlug)
        )
      )
      .limit(1);

    let provisionResult: TenantProvisionResult | undefined = undefined;

    // If no contract exists, provision full intelligence stack
    if (existingContracts.length === 0) {
      const provisionInput: TenantIntelligenceProvisionInput = {
        tenantId: canonical.canonicalOrgId,
        organizationName: canonical.title,
        agentName: customInput?.agentName || 'Hermes',
        projectMetadata: customInput?.projectMetadata || {
          tokenPriceUsd: 1.0,
          location: 'México',
          legalEntity: canonical.title,
        },
        customClaims: customInput?.customClaims || [],
        knowledgePacks: customInput?.knowledgePacks || [],
      };

      provisionResult = await TenantProvisioner.provisionTenantIntelligence(provisionInput);
    }

    // 2. Ensure Executable Canonical Journey exists in NeonDB
    await ensureTenantCanonicalJourney(canonical.projectSlug);

    // 3. Fetch latest active contract and registry info
    const [latestContract] = await db
      .select()
      .from(hermesClaimContracts)
      .where(
        or(
          eq(hermesClaimContracts.tenantId, canonical.canonicalOrgId),
          eq(hermesClaimContracts.tenantId, canonical.projectSlug)
        )
      )
      .limit(1);

    return {
      canonicalIdentity: canonical,
      hasClaimContract: !!latestContract,
      claimContractId: latestContract?.id,
      ipfsCid: latestContract?.ipfsCid || undefined,
      hasExecutableJourney: true,
      provisionResult,
      status: 'SOVEREIGN_READY',
    };
  }
}
