import { db } from "@saasfly/db-core";
import { courses } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { PortalTenantContext } from "@saasfly/shared";
import { assertPortalPermission } from "@saasfly/shared";

export class ContentDomainService {
  constructor(private context: PortalTenantContext) {
    if (!context.organizationId) {
      throw new Error("ContentDomainService requires a valid organizationId in context");
    }
  }

  /**
   * Fetches all courses/academy content for the tenant.
   */
  async getCourses() {
    // 1. Authorize Capability
    assertPortalPermission(this.context.permissions, 'growth.content');

    // 2. Fetch courses (currently global in schema)
    const tenantCourses = await db.select().from(courses);
    return tenantCourses;
  }

  /**
   * Helper to resolve the numerical projectId.
   */
  private async resolveProjectId(): Promise<number> {
    const { projects } = await import("@/db/schema");
    const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, this.context.organizationSlug)).limit(1);
    if (!project) throw new Error("Project not found for organization");
    return project.id;
  }
}
