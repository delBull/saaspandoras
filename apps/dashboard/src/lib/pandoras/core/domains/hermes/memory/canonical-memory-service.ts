import { db } from '@/db';
import { hermesCanonicalMemory } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { CanonicalMemoryFact } from '../runtime/contracts';

/**
 * Service to manage Canonical Memory (Cross-Channel Memory).
 * Enforces the invariant: Memory is always Tenant-Scoped (organizationId + identityId).
 */
export class CanonicalMemoryService {
  /**
   * Retrieves active canonical memory facts for a given identity within a tenant.
   * 
   * INVARIANT: Never fetches cross-tenant memory.
   * INVARIANT: Only fetches 'ACTIVE' facts.
   * 
   * @param organizationId The tenant/organization scope
   * @param identityId The canonical identity ID of the user
   */
  static async getActiveMemory(organizationId: string, identityId: string): Promise<CanonicalMemoryFact[]> {
    if (!organizationId || !identityId) {
      return [];
    }

    try {
      const records = await db
        .select()
        .from(hermesCanonicalMemory)
        .where(
          and(
            eq(hermesCanonicalMemory.organizationId, organizationId),
            eq(hermesCanonicalMemory.identityId, identityId),
            eq(hermesCanonicalMemory.status, 'ACTIVE')
          )
        );

      return records.map((record) => ({
        id: record.id,
        type: record.type,
        content: record.content,
        source: record.source || record.sourceType,
        sourceType: record.sourceType,
        confidence: record.confidence ?? undefined,
      }));
    } catch (error) {
      console.error('[CanonicalMemoryService] Error fetching memory:', error);
      return []; // Fail-safe: empty memory on failure
    }
  }
}
