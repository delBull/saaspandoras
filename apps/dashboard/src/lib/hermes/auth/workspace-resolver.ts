import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { HermesAuthError } from './hermes-session.types';

export interface ResolvedWorkspace {
  organizationId: string; // Canonical UUID
  organizationName: string;
  tenantSlug: string;
  projectId: number;
}

export class HermesWorkspaceResolver {
  /**
   * Resolves any identifier (slug, UUID string, or numeric projectId) into the canonical Organization UUID.
   * 
   * Invariant: Internal Hermes OS boundary uses ONLY organizationId (UUID).
   */
  static async resolveCanonicalWorkspace(identifier: string | number): Promise<ResolvedWorkspace> {
    if (!identifier) {
      throw new HermesAuthError('Workspace identifier cannot be empty.', 'INVALID_WORKSPACE_IDENTIFIER', 400);
    }

    const idStr = String(identifier).trim();
    const isNumeric = /^\d+$/.test(idStr);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);

    const conditions = [];
    if (isUuid) {
      conditions.push(eq(projects.organizationId, idStr));
    }
    if (isNumeric) {
      conditions.push(eq(projects.id, parseInt(idStr, 10)));
    }
    // Always check slug
    conditions.push(eq(projects.slug, idStr));

    try {
      const rows = await db
        .select({
          id: projects.id,
          organizationId: projects.organizationId,
          title: projects.title,
          slug: projects.slug,
        })
        .from(projects)
        .where(or(...conditions))
        .limit(1);

      const match = rows[0];
      if (!match) {
        throw new HermesAuthError(`Workspace '${identifier}' not found.`, 'WORKSPACE_NOT_FOUND', 404);
      }

      return {
        organizationId: match.organizationId,
        organizationName: match.title,
        tenantSlug: match.slug,
        projectId: match.id,
      };
    } catch (err: any) {
      if (err instanceof HermesAuthError) throw err;
      throw new HermesAuthError(`Failed to resolve workspace '${identifier}': ${err.message}`, 'WORKSPACE_RESOLUTION_FAILED', 500);
    }
  }
}
