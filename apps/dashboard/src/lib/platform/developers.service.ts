import { db } from "@/db";
import { integrationClients, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PortalTenantContext } from "@/lib/portal/portal-types";
import { assertPortalPermission } from "@/lib/portal/permissions";
import crypto from "crypto";

export class DeveloperDomainService {
  constructor(private context: PortalTenantContext) {
    if (!context.organizationId) {
      throw new Error("DeveloperDomainService requires a valid organizationId in context");
    }
  }

  /**
   * Retrieves keys metadata without returning the actual raw secrets.
   */
  async getKeys() {
    // 1. Authorize Capability
    assertPortalPermission(this.context.permissions, 'developer.api');

    const projectId = await this.resolveProjectId();

    const keys = await db.select({
      id: integrationClients.id,
      name: integrationClients.name,
      environment: integrationClients.environment,
      keyFingerprint: integrationClients.keyFingerprint,
      isActive: integrationClients.isActive,
      lastUsedAt: integrationClients.lastUsedAt,
      createdAt: integrationClients.createdAt,
    })
    .from(integrationClients)
    .where(eq(integrationClients.projectId, projectId));

    return keys;
  }

  /**
   * Generates a new API Key.
   * Returns the raw secret ONLY ONCE. 
   * It is never stored in plaintext in the database.
   */
  async generateKey(name: string, environment: 'production' | 'staging' = 'staging') {
    // 1. Authorize Capability
    assertPortalPermission(this.context.permissions, 'developer.api');

    const projectId = await this.resolveProjectId();

    // 2. Generate Secret Material
    const rawSecret = `pk_${environment === 'production' ? 'live' : 'test'}_${crypto.randomBytes(32).toString('hex')}`;
    
    // 3. Hash for storage
    const apiKeyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    
    // 4. Create Fingerprint (e.g., pk_test_...abcd)
    const keyFingerprint = `${rawSecret.substring(0, 12)}...${rawSecret.substring(rawSecret.length - 4)}`;

    const [client] = await db.insert(integrationClients).values({
      name,
      environment,
      projectId,
      apiKeyHash,
      keyFingerprint,
      isActive: true,
      permissions: ['api.full_access']
    }).returning();

    if (!client) {
      throw new Error("Failed to create key: insert did not return record.");
    }

    // Returning rawSecret here is intentional and safe because this is the single-view generation moment.
    return {
      success: true,
      client: {
        id: client.id,
        name: client.name,
        environment: client.environment,
        keyFingerprint: client.keyFingerprint
      },
      rawSecret // The single-view secret
    };
  }

  /**
   * Revokes a key permanently.
   */
  async revokeKey(keyId: string) {
    assertPortalPermission(this.context.permissions, 'developer.api');
    
    const projectId = await this.resolveProjectId();

    const [updated] = await db.update(integrationClients)
      .set({ 
        isActive: false, 
        revokedAt: new Date() 
      })
      .where(
        and(
          eq(integrationClients.id, keyId),
          eq(integrationClients.projectId, projectId)
        )
      )
      .returning();

    return { success: !!updated };
  }

  /**
   * Helper to resolve the numerical projectId.
   */
  private async resolveProjectId(): Promise<number> {
    const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, this.context.organizationSlug)).limit(1);
    if (!project) throw new Error("Project not found for organization");
    return project.id;
  }
}
