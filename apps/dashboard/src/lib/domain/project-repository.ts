import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";

export class ProjectRepository {
  static async findById(id: number) {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || null;
  }

  static async findBySlug(slug: string) {
    const [project] = await db.select().from(projects).where(ilike(projects.slug, slug));
    return project || null;
  }

  static async updateConfig(projectId: number, config: any) {
    await db.update(projects)
      .set({ extraConfig: config })
      .where(eq(projects.id, projectId));
  }

  static async updateTenantRuntimeConfig(slug: string, tenantRuntimeConfig: any) {
    await db.update(projects)
      .set({ tenantRuntimeConfig, updatedAt: new Date() })
      .where(ilike(projects.slug, slug));
  }
}
