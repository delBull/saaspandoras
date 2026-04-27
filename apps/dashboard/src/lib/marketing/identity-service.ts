import { db } from '@/db';
import { marketingLeads } from '@/db/schema';
import { eq, or, and, isNull } from 'drizzle-orm';
import { createHash } from 'crypto';

export class IdentityService {
  /**
   * Generates a deterministic hash based on available identifiers.
   * This is used to link users across sessions even if they change devices.
   */
  static getIdentityHash(email?: string | null, walletAddress?: string | null, fingerprint?: string | null, phoneNumber?: string | null): string | null {
    if (!email && !walletAddress && !fingerprint && !phoneNumber) return null;
    
    // Normalize data
    const components = [
      email?.toLowerCase().trim() || '',
      walletAddress?.toLowerCase().trim() || '',
      fingerprint?.trim() || '',
      phoneNumber?.trim() || ''
    ].filter(Boolean);

    if (components.length === 0) return null;

    return createHash('sha256')
      .update(components.sort().join('|'))
      .digest('hex');
  }

  /**
   * Finds all lead records that might belong to the same identity.
   */
  static async resolveLeads(identifiers: { email?: string; walletAddress?: string; fingerprint?: string; phoneNumber?: string }) {
    const { email, walletAddress, fingerprint, phoneNumber } = identifiers;
    const identityHash = this.getIdentityHash(email, walletAddress, fingerprint, phoneNumber);

    const conditions = [];
    if (email) conditions.push(eq(marketingLeads.email, email.toLowerCase()));
    if (walletAddress) conditions.push(eq(marketingLeads.walletAddress, walletAddress.toLowerCase()));
    if (fingerprint) conditions.push(eq(marketingLeads.fingerprint, fingerprint));
    if (phoneNumber) conditions.push(eq(marketingLeads.phoneNumber, phoneNumber));
    if (identityHash) conditions.push(eq(marketingLeads.identityHash, identityHash));

    if (conditions.length === 0) return [];

    return await db.query.marketingLeads.findMany({
      where: or(...conditions),
    });
  }

  /**
   * Links a verified Core User ID to all matching marketing leads.
   * This is the "Aha!" moment where anonymous data becomes identified.
   */
  static async linkIdentity(userId: string, identifiers: { email?: string; walletAddress?: string; fingerprint?: string; phoneNumber?: string }) {
    const leads = await this.resolveLeads(identifiers);
    const leadIds = leads.map(l => l.id);

    if (leadIds.length === 0) return { linkedCount: 0 };

    const { email, walletAddress, fingerprint, phoneNumber } = identifiers;
    const identityHash = this.getIdentityHash(email, walletAddress, fingerprint, phoneNumber);

    // Update all leads that belong to this identity but don't have a userId yet
    const result = await db.update(marketingLeads)
      .set({ 
        userId,
        identityHash: identityHash || undefined,
        updatedAt: new Date()
      })
      .where(
        and(
          isNull(marketingLeads.userId),
          or(...leadIds.map(id => eq(marketingLeads.id, id)))
        )
      )
      .returning({ id: marketingLeads.id });

    console.log(`🔗 [IdentityService] Linked ${result.length} leads to user ${userId}`);
    
    return {
      linkedCount: result.length,
      leadIds: result.map(l => l.id)
    };
  }
}
