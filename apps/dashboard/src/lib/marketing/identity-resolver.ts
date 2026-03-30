import { db } from "@/db";
import { marketingIdentities, users } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";

export interface IdentityIdentifiers {
  fingerprint?: string | null;
  walletAddress?: string | null;
  email?: string | null;
  telegramId?: string | null;
  userId?: string | null;
}

export class IdentityResolver {
  /**
   * Resolves a unified identity based on available identifiers.
   * If an identity exists for any identifier, it returns it.
   */
  static async resolveIdentity(identifiers: IdentityIdentifiers): Promise<number> {
    const { fingerprint, walletAddress, email, telegramId, userId } = identifiers;

    // 1. Check for existing identity by any identifier
    const conditions = [];
    if (fingerprint) conditions.push(eq(marketingIdentities.fingerprint, fingerprint));
    if (walletAddress) conditions.push(eq(marketingIdentities.walletAddress, walletAddress.toLowerCase()));
    if (email) conditions.push(eq(marketingIdentities.email, email.toLowerCase()));
    if (telegramId) conditions.push(eq(marketingIdentities.telegramId, telegramId));
    if (userId) conditions.push(eq(marketingIdentities.userId, userId));

    if (conditions.length === 0) {
      // No identifiers provided, generate a new anonymous identity
      const [newIdentity] = await db.insert(marketingIdentities).values({
        fingerprint: fingerprint || null,
        updatedAt: new Date(),
      }).returning({ id: marketingIdentities.id });
      
      if (!newIdentity) {
        throw new Error("Failed to create anonymous identity");
      }
      
      return newIdentity.id;
    }

    const existingIdentities = await db
      .select()
      .from(marketingIdentities)
      .where(or(...conditions));

    if (existingIdentities.length > 0) {
      // Found at least one. Use the most specific one (User > Wallet > Email > Fingerprint)
      const prioritized = existingIdentities.sort((a, b) => {
        const score = (id: typeof marketingIdentities.$inferSelect) => {
          if (id.userId) return 100;
          if (id.walletAddress) return 80;
          if (id.email) return 60;
          if (id.telegramId) return 40;
          if (id.fingerprint) return 20;
          return 0;
        };
        return score(b) - score(a);
      });

      const primaryIdentity = prioritized[0];
      if (!primaryIdentity) {
        throw new Error("Identity resolution failure: no primary identity found");
      }
      
      // Update primary identity with any new info
      const updates: any = {};
      if (!primaryIdentity.fingerprint && fingerprint) updates.fingerprint = fingerprint;
      if (!primaryIdentity.walletAddress && walletAddress) updates.walletAddress = walletAddress.toLowerCase();
      if (!primaryIdentity.email && email) updates.email = email.toLowerCase();
      if (!primaryIdentity.telegramId && telegramId) updates.telegramId = telegramId;
      if (!primaryIdentity.userId && userId) updates.userId = userId;

      if (Object.keys(updates).length > 0) {
        await db.update(marketingIdentities)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(marketingIdentities.id, primaryIdentity.id));
      }

      return primaryIdentity.id;
    }

    // 2. No match found, create new one
    const [newIdentity] = await db.insert(marketingIdentities).values({
      fingerprint: fingerprint || null,
      walletAddress: walletAddress?.toLowerCase() || null,
      email: email?.toLowerCase() || null,
      telegramId: telegramId || null,
      userId: userId || null,
      updatedAt: new Date(),
    }).returning({ id: marketingIdentities.id });

    if (!newIdentity) {
      throw new Error("Failed to create new marketing identity");
    }

    return newIdentity.id;
  }

  /**
   * Link a core User to a marketing identity.
   */
  static async linkUser(userId: string, marketingIdentityId: number) {
    await db.update(marketingIdentities)
      .set({ userId, updatedAt: new Date() })
      .where(eq(marketingIdentities.id, marketingIdentityId));
  }
}
