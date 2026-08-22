import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { KnowledgeStatus } from './exclusion-register';

export type KnowledgeDimension = 'identity' | 'business' | 'brand' | 'agent_soul' | 'projects' | 'products' | 'market' | 'operations' | 'governance' | 'public';

export interface KnowledgeMutationEvent {
  id: string;
  organizationId: string;
  dimension: KnowledgeDimension;
  actorId: string;
  source: string;
  previousVersion: number;
  newVersion: number;
  status: KnowledgeStatus;
  timestamp: string;
  content: string;
}

export interface ControlPlaneContext {
  organizationId: string;
  actorId: string;
  sessionId: string;
  permissions: string[];
}

export class TenantKnowledgeStore {
  /**
   * C6.1, C6.2: organizationId comes strictly from the ControlPlaneContext, NEVER from the LLM payload.
   * C6.3: Writes are strictly isolated by Dimension.
   */
  static async updateKnowledge(
    context: ControlPlaneContext,
    dimension: KnowledgeDimension,
    content: string
  ): Promise<{ success: boolean; event?: KnowledgeMutationEvent; error?: string }> {

    // C6.2: Tenant Isolation Check
    if (!context.organizationId) {
      return { success: false, error: 'MISSING_ORGANIZATION_ID_IN_CONTEXT' };
    }

    try {
      const projectRecord = await db.query.projects.findFirst({
        where: (projects, { or, eq }) => or(
          eq(projects.organizationId, context.organizationId),
          eq(projects.slug, context.organizationId)
        )
      });

      if (!projectRecord) {
        return { success: false, error: 'ORGANIZATION_NOT_FOUND' };
      }

      // C6.7: Governance isolation. LLM cannot authorize rules.
      let status: KnowledgeStatus = 'DISCOVERED'; // C6.4: All LLM knowledge enters as DISCOVERED
      if (dimension === 'governance') {
        // Even if discovered, governance from LLM remains strictly descriptive/UNVERIFIED
        status = 'UNKNOWN';
      }

      const rtConfig = (projectRecord.tenantRuntimeConfig as any) || {};
      const knowledgePack = rtConfig.knowledgePack || {};

      const currentVersion = knowledgePack[`${dimension}_version`] || 0;
      const nextVersion = currentVersion + 1;

      // Update the dimension
      knowledgePack[dimension] = {
        content,
        status,
        updatedAt: new Date().toISOString()
      };
      knowledgePack[`${dimension}_version`] = nextVersion;

      // C6.5, C6.6: Immutable versioning and Mutation Audit Trail
      const mutationEvent: KnowledgeMutationEvent = {
        id: `mut_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        organizationId: context.organizationId,
        dimension,
        actorId: context.actorId,
        source: 'LLM_ONBOARDING_DISCOVERY',
        previousVersion: currentVersion,
        newVersion: nextVersion,
        status,
        timestamp: new Date().toISOString(),
        content
      };

      const auditLog = rtConfig.knowledgeAuditLog || [];
      auditLog.push(mutationEvent);
      rtConfig.knowledgeAuditLog = auditLog;
      rtConfig.knowledgePack = knowledgePack;

      await db.update(projects)
        .set({ tenantRuntimeConfig: rtConfig })
        .where(eq(projects.slug, context.organizationId));

      return { success: true, event: mutationEvent };
    } catch (e: any) {
      console.error('[TenantKnowledgeStore] Error updating knowledge:', e);
      return { success: false, error: e.message };
    }
  }
}
