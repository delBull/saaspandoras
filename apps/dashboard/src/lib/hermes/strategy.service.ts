import { PortalTenantContext } from "@/lib/portal/portal-types";
import { assertPortalPermission } from "@/lib/portal/permissions";
import fs from 'fs';
import path from 'path';

export class StrategyDomainService {
  constructor(private context: PortalTenantContext) {
    if (!context.organizationId) {
      throw new Error("StrategyDomainService requires a valid organizationId in context");
    }
  }

  /**
   * Fetches global platform knowledge (Pandora Strategy).
   * This is read-only and explicitly marked as Global/Platform level.
   */
  async getGlobalPlatformKnowledge(docType: 'growth-roadmap' | 'monetization-plan' | 'ecosystem-architecture') {
    // 1. Authorize Capability
    assertPortalPermission(this.context.permissions, 'growth.strategy');

    // Currently these are stored as markdown files in the project directory
    const docPath = path.join(process.cwd(), 'DOCUMENTACIÓN', 'Knowledge', `${docType}.md`);
    
    try {
      if (fs.existsSync(docPath)) {
        const content = fs.readFileSync(docPath, 'utf8');
        return { success: true, content, type: 'GLOBAL_PLATFORM_KNOWLEDGE' };
      }
      
      // Fallback to Admin documentation paths if Knowledge dir doesn't exist
      const adminDocPath = path.join(process.cwd(), 'DOCUMENTACIÓN', 'Admin', `${docType}.md`);
      if (fs.existsSync(adminDocPath)) {
        const content = fs.readFileSync(adminDocPath, 'utf8');
        return { success: true, content, type: 'GLOBAL_PLATFORM_KNOWLEDGE' };
      }

      return { success: false, error: "Global knowledge document not found" };
    } catch (error) {
      console.error("Error reading global knowledge doc:", error);
      return { success: false, error: "Failed to read global knowledge document" };
    }
  }

  /**
   * Fetches tenant-specific strategy if it exists.
   * This isolates the strategy strictly to the authenticated tenant.
   */
  async getTenantStrategy() {
    assertPortalPermission(this.context.permissions, 'growth.strategy');

    // Future enhancement: Fetch tenant-specific strategy docs from the DB
    // e.g., db.select().from(tenantStrategies).where(eq(tenantStrategies.tenantId, this.context.organizationId))
    
    return {
      success: true,
      content: `### Tenant Strategy for ${this.context.organizationSlug}\n\nNo custom strategy defined yet.`,
      type: 'TENANT_STRATEGY'
    };
  }
}
