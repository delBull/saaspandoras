/**
 * 🏛️ Tenant Context Resolver (F2 Core)
 * apps/dashboard/src/lib/identity/tenant-context-resolver.ts
 *
 * Inviolable Boundary:
 * Canonical Identity ≠ Tenant Membership ≠ Role ≠ Capability ≠ Execution Authority
 *
 * Responsibilities:
 * 1. Takes a Canonical Identity Record and an organization/project identifier.
 * 2. Resolves canonical tenant boundaries via TenantAuthorityService.
 * 3. Evaluates tenant-scoped membership (daoMembers, marketingLeads, ambassadors).
 * 4. STRICT ISOLATION: Guarantees that assets, voting power, and statuses from one tenant
 *    are NEVER leaked or shared with another tenant.
 */

import { db } from '@/db';
import { daoMembers, marketingLeads, ambassadors } from '@/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { TenantAuthorityService } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';
import { CanonicalIdentityGraph } from './canonical-identity-graph';
import type { CanonicalIdentityRecord } from './types';

export interface TenantMembershipInfo {
  isMember: boolean;
  role: 'INVESTOR' | 'GESTOR' | 'LEAD' | 'VISITOR';
  status: string; // 'whitelisted' | 'active' | 'pending' | 'visitor'
  votingPower: number;
  tokensOwned: number;
  isWhitelisted: boolean;
  isGestor: boolean;
  gestorStatus: string;
}

export interface TenantContextRecord {
  identityId: string;
  organizationId: string;
  canonicalOrgId: string;
  projectId: number | null;
  projectTitle: string;
  membership: TenantMembershipInfo;
  tenantLeadId: string | null;
  resolvedAt: Date;
}

export class TenantContextResolver {
  /**
   * Resolves the authoritative tenant context for a given canonical identity.
   */
  static async resolveTenantContext(
    identityOrId: CanonicalIdentityRecord | string,
    organizationIdentifier: string
  ): Promise<TenantContextRecord | null> {
    if (!identityOrId || !organizationIdentifier) {
      throw new Error('[TenantContextResolver] Missing identity or organizationIdentifier');
    }

    // 1. Resolve Identity Record if ID string is provided
    let identity: CanonicalIdentityRecord | null;
    if (typeof identityOrId === 'string') {
      // Find by ID in DB
      const row = await db.query.marketingIdentities.findFirst({
        where: (m, { eq }) => eq(m.id, identityOrId),
      });
      if (!row) return null;
      identity = (CanonicalIdentityGraph as any).mapToRecord(row);
    } else {
      identity = identityOrId;
    }

    if (!identity) return null;

    // 2. Resolve Canonical Tenant Boundary (K27.1 Authority)
    const canonicalTenant = await TenantAuthorityService.resolveCanonicalTenant(organizationIdentifier);
    if (!canonicalTenant) {
      console.warn(`[TenantContextResolver] Unknown or unresolvable tenant '${organizationIdentifier}'`);
      return null;
    }

    const projectId = canonicalTenant.projectId;
    const now = new Date();

    // Default unprivileged context (Visitor)
    const membership: TenantMembershipInfo = {
      isMember: false,
      role: 'VISITOR',
      status: 'visitor',
      votingPower: 0,
      tokensOwned: 0,
      isWhitelisted: false,
      isGestor: false,
      gestorStatus: 'none',
    };

    let tenantLeadId: string | null = null;

    // Ecosystem Root (pandoras) doesn't have local dao_members or inventory
    if (canonicalTenant.canonicalOrgId === 'pandoras' || projectId === 0 || projectId === null) {
      return {
        identityId: identity.identityId,
        organizationId: organizationIdentifier,
        canonicalOrgId: canonicalTenant.canonicalOrgId,
        projectId: null,
        projectTitle: canonicalTenant.title,
        membership,
        tenantLeadId: null,
        resolvedAt: now,
      };
    }

    // 3. Query Tenant-Scoped Governance & Investments (daoMembers)
    const wallet = identity.identifiers.wallet ? identity.identifiers.wallet.toLowerCase() : null;

    if (wallet) {
      try {
        const [member, ambassadorData] = await Promise.all([
          db.query.daoMembers.findFirst({
            where: and(
              eq(daoMembers.projectId, projectId),
              eq(daoMembers.wallet, wallet)
            ),
          }).catch(() => null),
          db.query.ambassadors.findFirst({
            where: and(
              eq(ambassadors.projectId, projectId),
              ilike(ambassadors.walletAddress, wallet)
            ),
          }).catch(() => null),
        ]);

        if (member) {
          membership.isMember = true;
          membership.role = 'INVESTOR';
          membership.votingPower = Number(member.votingPower || 0);
          membership.tokensOwned = Number((member as any).tokensOwned || member.votingPower || 0);
          membership.isWhitelisted = true;
          membership.status = 'active';
        }

        if (ambassadorData) {
          membership.isGestor = true;
          membership.gestorStatus = ambassadorData.status;
          if (membership.role !== 'INVESTOR') {
            membership.role = 'GESTOR';
          }
        }
      } catch (err) {
        console.warn(`[TenantContextResolver] Non-blocking governance lookup error:`, err);
      }
    }

    // 4. Query Tenant-Scoped Ingestion & Nurturing (marketingLeads)
    try {
      const orClauses = [];
      if (identity.identityId) orClauses.push(eq(marketingLeads.identityId, identity.identityId));
      if (wallet) orClauses.push(eq(marketingLeads.walletAddress, wallet));
      if (identity.identifiers.email) orClauses.push(eq(marketingLeads.email, identity.identifiers.email.toLowerCase()));
      if (identity.identifiers.phone) {
        const p = identity.identifiers.phone;
        orClauses.push(or(eq(marketingLeads.phoneNumber, p), eq(marketingLeads.phoneNumber, `+${p}`)));
      }

      const lead = await db.query.marketingLeads.findFirst({
        where: and(
          eq(marketingLeads.projectId, projectId),
          or(...orClauses)
        ),
      });

      if (lead) {
        tenantLeadId = lead.id;
        const leadStatus = (lead.status || '').toLowerCase();
        if (leadStatus === 'whitelisted' || leadStatus === 'active') {
          membership.isWhitelisted = true;
        }
        if (!membership.isMember) {
          membership.status = lead.status || 'active';
          membership.role = 'LEAD';
        }
      }
    } catch (leadErr) {
      console.warn(`[TenantContextResolver] Non-blocking lead lookup error:`, leadErr);
    }

    return {
      identityId: identity.identityId,
      organizationId: organizationIdentifier,
      canonicalOrgId: canonicalTenant.canonicalOrgId,
      projectId,
      projectTitle: canonicalTenant.title,
      membership,
      tenantLeadId,
      resolvedAt: now,
    };
  }
}
