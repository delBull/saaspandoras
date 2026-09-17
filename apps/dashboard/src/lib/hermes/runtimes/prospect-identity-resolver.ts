import { IdentityResolver, IdentityIdentifiers } from '@/lib/marketing/identity-resolver';
import { ProspectIdentity } from './prospect-intelligence-types';
import { db } from '@/db';
import { marketingIdentities } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 🛡️ Security Boundary (Phase 1 Identity Contract)
 *
 * Resolves a client-provided identity hint (email, fingerprint, wallet)
 * into a Canonical Marketing Identity. 
 *
 * Important Security Rule: The LLM must NEVER rely on the raw identity hint.
 * It must ONLY use the resolved Canonical Identity.
 */
export class ProspectIdentityResolver {
  /**
   * Resolves the given hint into a Canonical Prospect Identity.
   * If the identity doesn't exist, it creates a new one deterministically.
   */
  static async resolve(hint: IdentityIdentifiers): Promise<ProspectIdentity> {
    // 1. Resolve to the canonical marketing identity ID
    const marketingIdentityId = await IdentityResolver.resolveIdentity(hint);

    // 2. Fetch the full canonical identity to populate the context
    const [identityRecord] = await db
      .select()
      .from(marketingIdentities)
      .where(eq(marketingIdentities.id, marketingIdentityId))
      .limit(1);

    if (!identityRecord) {
      // This should never happen if IdentityResolver behaves correctly, but fail-closed if it does
      throw new Error(`[ProspectIdentityResolver] Canonical identity ${marketingIdentityId} not found in database.`);
    }

    return {
      marketingIdentityId: identityRecord.id,
      canonicalId: `usr_${identityRecord.id}`, // Generic canonical representation
      email: identityRecord.email || undefined,
      wallet: identityRecord.walletAddress || undefined,
      // name could be derived if linked to a user, but we'll stick to marketing layer for now
      resolvedAt: new Date()
    };
  }
}
