/**
 * 🔐 Wallet → Tenant Membership Verification
 * src/lib/hermes/auth/wallet-tenant-membership.ts
 *
 * Fail-closed validation for the Web Wallet authentication branch used by
 * the Growth OS / Control Plane API boundaries. Resolves whether a
 * connected wallet is authorized for a given tenant (organization).
 *
 * Authority rules mirror HermesTenantMembershipService:
 *   - OWNER    → projects.applicantWalletAddress === wallet
 *   - OPERATOR → dao_members.wallet === wallet (for the tenant's project)
 *
 * Returns `false` whenever the wallet cannot be proven authorized (fail-closed),
 * so callers can return 401/403 without leaking tenant existence.
 */

import { db } from '@/db';
import { projects, daoMembers } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function isWalletAuthorizedForTenant(
  wallet: string,
  tenant: string
): Promise<boolean> {
  if (!wallet || !tenant) return false;

  const cleanSlug = tenant.replace(/^org_/, '').trim().toLowerCase();
  const normalizedWallet = wallet.toLowerCase();

  if (!cleanSlug) return false;

  let project: { id: number; applicantWalletAddress: string | null } | undefined;
  try {
    project = await db
      .select({
        id: projects.id,
        applicantWalletAddress: projects.applicantWalletAddress,
      })
      .from(projects)
      .where(
        or(
          eq(projects.slug, cleanSlug),
          eq(projects.slug, tenant.replace(/^org_/, ''))
        )
      )
      .limit(1)
      .then(rows => rows[0]);
  } catch (err: any) {
    console.error('[WalletTenantMembership] Project lookup error:', err?.message || err);
    return false;
  }

  if (!project) return false;

  // OWNER authority: wallet is the applicant/owner of the project
  if (project.applicantWalletAddress?.toLowerCase() === normalizedWallet) {
    return true;
  }

  // OPERATOR authority: wallet is a DAO member of the project
  try {
    const member = await db
      .select({ projectId: daoMembers.projectId })
      .from(daoMembers)
      .where(
        or(
          eq(daoMembers.projectId, project.id),
          eq(daoMembers.wallet, normalizedWallet)
        )
      )
      .limit(1);
    if (member[0] && member[0].projectId === project.id) {
      return true;
    }
  } catch (err: any) {
    console.error('[WalletTenantMembership] DAO member lookup error:', err?.message || err);
    return false;
  }

  return false;
}
