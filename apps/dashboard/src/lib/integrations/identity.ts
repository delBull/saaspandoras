import { db } from "@/db";
import { marketingIdentities, users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { PlatformEventPayload } from "./events-schema";

export class IdentityService {
  /**
   * Resolves a canonical identityId from an incoming event.
   * Checks phone, email, and externalId. 
   * If no identity exists, it creates one.
   */
  static async resolveEventIdentity(event: PlatformEventPayload): Promise<string> {
    const { identity } = event;
    
    // If no identity provided, create an anonymous identity based on correlationId or eventId
    if (!identity || (!identity.phone && !identity.email && !identity.externalId)) {
      const [newIdentity] = await db.insert(marketingIdentities).values({
        fingerprint: `anon_${event.correlationId}`,
        metadata: { source: event.source, correlationId: event.correlationId }
      }).returning({ id: marketingIdentities.id });
      
      if (!newIdentity) throw new Error("Failed to create anonymous identity");
      return newIdentity.id;
    }

    // Try to find an existing identity by phone, email, or externalId (fingerprint)
    const conditions = [];
    if (identity.phone) conditions.push(eq(marketingIdentities.phone, identity.phone));
    if (identity.email) conditions.push(eq(marketingIdentities.email, identity.email));
    if (identity.externalId) conditions.push(eq(marketingIdentities.fingerprint, identity.externalId));
    
    if (conditions.length > 0) {
      const existing = await db.query.marketingIdentities.findFirst({
        where: or(...conditions)
      });

      if (existing) {
        return existing.id;
      }
    }

    // If none found, create a new identity with the provided details
    const [newIdentity] = await db.insert(marketingIdentities).values({
      phone: identity.phone || null,
      email: identity.email || null,
      fingerprint: identity.externalId || `ext_${event.correlationId}`,
      metadata: { 
        source: event.source,
        createdAtEvent: event.eventId 
      }
    }).returning({ id: marketingIdentities.id });

    if (!newIdentity) throw new Error("Failed to create identity");
    return newIdentity.id;
  }
}
