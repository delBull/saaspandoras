import { db } from '@/db';
import { marketingLeads, projects } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

export interface ResourceScope {
  canonicalOrgId: string;
  projectId?: number;
  scopeType: 'PROJECT' | 'ORGANIZATION';
}

export interface GrowthReadResult {
  status: 'SUCCESS' | 'UNAVAILABLE' | 'UNAUTHORIZED';
  data?: {
    totalLeads: number;
    activeLeads: number;
    newLeads: number;
  };
  reason?: string;
}

export class GrowthReadAdapter {
  static async getLeadMetrics(scope: ResourceScope): Promise<GrowthReadResult> {
    try {
      if (!scope.canonicalOrgId) {
        return { status: 'UNAUTHORIZED', reason: 'Missing canonical organization ID' };
      }

      // Resolve valid project IDs for the scope to ensure tenant isolation
      let validProjectIds: number[] = [];

      if (scope.scopeType === 'PROJECT') {
        if (!scope.projectId) {
           return { status: 'UNAUTHORIZED', reason: 'Project scope requested but no projectId provided' };
        }
        
        // Verify the project actually belongs to the organization
        const projectCheck = await db.select({ id: projects.id })
          .from(projects)
          .where(and(
            eq(projects.id, scope.projectId),
            eq(projects.organizationId, scope.canonicalOrgId)
          ));
          
        if (projectCheck.length === 0) {
           return { status: 'UNAUTHORIZED', reason: 'Project does not belong to the authorized organization' };
        }
        validProjectIds = [scope.projectId];
      } else if (scope.scopeType === 'ORGANIZATION') {
        const orgProjects = await db.select({ id: projects.id })
          .from(projects)
          .where(eq(projects.organizationId, scope.canonicalOrgId));
          
        validProjectIds = orgProjects.map(p => p.id);
        
        if (validProjectIds.length === 0) {
          // Valid org, but no projects. 0 leads.
          return {
            status: 'SUCCESS',
            data: { totalLeads: 0, activeLeads: 0, newLeads: 0 }
          };
        }
      }

      const condition = inArray(marketingLeads.projectId, validProjectIds);

      const totalResult = await db
        .select({ value: sql<number>`count(*)` })
        .from(marketingLeads)
        .where(condition);
        
      const activeResult = await db
        .select({ value: sql<number>`count(*)` })
        .from(marketingLeads)
        .where(and(condition, eq(marketingLeads.status, 'active')));
        
      const newResult = await db
        .select({ value: sql<number>`count(*)` })
        .from(marketingLeads)
        .where(and(condition, eq(marketingLeads.status, 'new')));

      return {
        status: 'SUCCESS',
        data: {
          totalLeads: Number(totalResult[0]?.value || 0),
          activeLeads: Number(activeResult[0]?.value || 0),
          newLeads: Number(newResult[0]?.value || 0)
        }
      };
    } catch (e: any) {
      console.error('[GrowthReadAdapter] DB Error:', e);
      return { status: 'UNAVAILABLE', reason: 'DB_READ_FAILED' };
    }
  }
}
