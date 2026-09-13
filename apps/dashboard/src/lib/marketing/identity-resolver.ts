import { db } from "@/db";
import { marketingIdentities, users } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";

export interface IdentityIdentifiers {
  fingerprint?: string | null;
  walletAddress?: string | null;
  email?: string | null;
  phone?: string | null;
  telegramId?: string | null;
  userId?: string | null;
}

export class IdentityResolver {
  /**
   * Resolves a unified identity based on available identifiers.
   * If an identity exists for any identifier, it returns it.
   */
  static async resolveIdentity(identifiers: IdentityIdentifiers): Promise<string> {
    const { fingerprint, walletAddress, email, phone, telegramId, userId } = identifiers;
    const cleanPhone = phone ? phone.replace(/[\s\-\(\)\+]/g, '') : null;

    // 1. Check for existing identity by any identifier
    const conditions = [];
    if (fingerprint) conditions.push(eq(marketingIdentities.fingerprint, fingerprint));
    if (walletAddress) conditions.push(eq(marketingIdentities.walletAddress, walletAddress.toLowerCase()));
    if (email) conditions.push(eq(marketingIdentities.email, email.toLowerCase()));
    if (cleanPhone) conditions.push(or(eq(marketingIdentities.phone, cleanPhone), eq(marketingIdentities.phone, `+${cleanPhone}`)));
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
      // ⚠️ Constraint A: Anti-Auto-Merge & Collision Detection (Matching ≠ Proof)
      if (existingIdentities.length > 1) {
        // Multiple disjoint identities matched! Auto-merging them is strictly forbidden.
        try {
          const { SecurityAuditLogger } = await import(
            '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger'
          );
          await SecurityAuditLogger.logEvent({
            organizationId: 'pandoras',
            eventType: 'IDENTITY_COLLISION_BLOCKED',
            severity: 'WARN',
            policyDecision: 'DENY',
            correlationId: `marketing_col_${Date.now()}`,
            metadata: {
              reason: 'Multiple existing identities matched provided identifiers in legacy resolver. Auto-merge blocked.',
              matchedCount: existingIdentities.length,
              matchedIdentityIds: existingIdentities.map(i => i.id),
              attemptedIdentifiers: {
                hasWallet: !!walletAddress,
                hasEmail: !!email,
                hasPhone: !!cleanPhone,
                hasTelegram: !!telegramId,
              },
            },
          });
        } catch (auditErr) {
          console.warn('[IdentityResolver] Failed to record collision audit event:', auditErr);
        }

        // Return the highest-priority identity WITHOUT merging any colliding identifiers
        const prioritized = existingIdentities.sort((a, b) => {
          const score = (id: typeof marketingIdentities.$inferSelect) => {
            if (id.userId) return 100;
            if (id.walletAddress) return 80;
            if (id.email) return 60;
            if (id.phone) return 50;
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
        return primaryIdentity.id;
      }

      // Exactly one identity matched. Only update fields that do NOT conflict with any other identity
      const primaryIdentity = existingIdentities[0];
      if (!primaryIdentity) {
        throw new Error("Identity resolution failure: no primary identity found");
      }
      
      const updates: any = {};
      if (!primaryIdentity.fingerprint && fingerprint) updates.fingerprint = fingerprint;
      if (!primaryIdentity.walletAddress && walletAddress) updates.walletAddress = walletAddress.toLowerCase();
      if (!primaryIdentity.email && email) updates.email = email.toLowerCase();
      if (!primaryIdentity.phone && cleanPhone) updates.phone = cleanPhone;
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
      phone: cleanPhone || null,
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
  static async linkUser(userId: string, marketingIdentityId: string) {
    await db.update(marketingIdentities)
      .set({ userId, updatedAt: new Date() })
      .where(eq(marketingIdentities.id, marketingIdentityId));
  }
}
