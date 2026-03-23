import { db } from "@/db";
import { marketingIdentities, users } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

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
   * If multiple identifiers point to different identities, it prioritizes and potentially merges (Log for future).
   */
  static async resolveIdentity(identifiers: IdentityIdentifiers): Promise<string> {
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
      const newIdentityId = uuidv4();
      await db.insert(marketingIdentities).values({
        id: newIdentityId,
        fingerprint: fingerprint || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return newIdentityId;
    }

    const existingIdentities = await db
      .select()
      .from(marketingIdentities)
      .where(or(...conditions));

    if (existingIdentities.length > 0) {
      // Found at least one. Use the most specific one (User > Wallet > Email > Fingerprint)
      const prioritized = existingIdentities.sort((a, b) => {
        if (a.userId && !b.userId) return -1;
        if (b.userId && !a.userId) return 1;
        if (a.walletAddress && !b.walletAddress) return -1;
        if (b.walletAddress && !a.walletAddress) return 1;
        if (a.email && !b.email) return -1;
        if (b.email && !a.email) return 1;
        return 0;
      });

      const primary = prioritized[0];
      if (!primary || !primary.id) {
          // Fallback if sort somehow returned empty array or missing ID
          const fallback = existingIdentities[0];
          if (!fallback) throw new Error("No identity found after lookup");
          return fallback.id;
      }

      // Update the primary identity with any new information
      const updateData: any = { updatedAt: new Date() };
      let needsUpdate = false;

      if (fingerprint && primary.fingerprint !== fingerprint) {
        updateData.fingerprint = fingerprint;
        needsUpdate = true;
      }
      if (walletAddress && primary.walletAddress !== walletAddress.toLowerCase()) {
        updateData.walletAddress = walletAddress.toLowerCase();
        needsUpdate = true;
      }
      if (email && primary.email !== email.toLowerCase()) {
        updateData.email = email.toLowerCase();
        needsUpdate = true;
      }
      if (telegramId && primary.telegramId !== telegramId) {
        updateData.telegramId = telegramId;
        needsUpdate = true;
      }
      if (userId && primary.userId !== userId) {
        updateData.userId = userId;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await db
          .update(marketingIdentities)
          .set(updateData)
          .where(eq(marketingIdentities.id, primary.id));
      }

      return primary.id;
    }

    // 2. No existing identity found, create new one
    const newId = uuidv4();
    await db.insert(marketingIdentities).values({
      id: newId,
      userId: userId || null,
      fingerprint: fingerprint || null,
      walletAddress: walletAddress?.toLowerCase() || null,
      email: email?.toLowerCase() || null,
      telegramId: telegramId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return newId;
  }

  /**
   * Link a core User to a marketing identity.
   * Usually called after a user signs up or connects a wallet for the first time.
   */
  static async linkUser(userId: string, marketingIdentityId: string) {
    await db.update(marketingIdentities)
      .set({ userId, updatedAt: new Date() })
      .where(eq(marketingIdentities.id, marketingIdentityId));
  }
}
