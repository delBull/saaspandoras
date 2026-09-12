/**
 * 🏛️ Pandoras Hermes OS — KnowledgeService (Milestone P0 Hardening)
 * apps/dashboard/src/lib/hermes/knowledge/service.ts
 *
 * Single canonical facade for tenant knowledge operations.
 * Enforces:
 * 1. Resolution of canonical tenant identity via TenantAuthorityService.
 * 2. Storage isolation: writes/reads scoped to canonical projectSlug / canonicalOrgId.
 * 3. Read access allows tenant knowledge + global namespace ('hermes_global').
 * 4. Backward-compatibility with dash-contracts (GetKnowledgeResponseDTO, etc.).
 */

import { db } from '@/db';
import { hermesKnowledge, knowledgeSources, knowledgeSourceVersions, knowledgeChunks } from '@/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { TenantAuthorityService, CanonicalTenantIdentity } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';
import { CreateKnowledgeSourceCommand } from '@/lib/pandoras/core/domains/control-plane/application/commands/knowledge/create-knowledge-source';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';
import type {
  KnowledgeFactDTO,
  KnowledgeSourceDTO,
  KnowledgeOverviewView,
  AddKnowledgeSourceRequestDTO,
} from '@/lib/dash-contracts/knowledge';
import { HermesTrialPolicyService } from '@/lib/hermes/trial/hermes-trial-policy.service';
import { HermesTrialTimelineService } from '@/lib/hermes/trial/hermes-trial-timeline.service';

export interface TenantKnowledgeSnapshot {
  facts: KnowledgeFactDTO[];
  sources: KnowledgeSourceDTO[];
  overview: KnowledgeOverviewView;
  canonicalTenant: CanonicalTenantIdentity;
}

export class KnowledgeService {
  /**
   * Resolves canonical tenant for the given identifier.
   * Fail-closed: throws if tenant does not exist.
   */
  public static async resolveTenantOrThrow(tenantIdentifier: string): Promise<CanonicalTenantIdentity> {
    const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantIdentifier);
    if (!canonical) {
      throw new Error(`[KnowledgeService] Tenant not found or unauthorized: ${tenantIdentifier}`);
    }
    return canonical;
  }

  /**
   * Get all knowledge assets for a tenant (facts + sources + overview).
   * Reads include tenant-specific records AND hermes_global system knowledge.
   */
  public static async getTenantKnowledge(tenantIdentifier: string): Promise<TenantKnowledgeSnapshot> {
    const canonical = await this.resolveTenantOrThrow(tenantIdentifier);
    const slug = canonical.projectSlug;
    const orgId = canonical.canonicalOrgId;

    // 1. Facts from hermesKnowledge: tenant specific OR hermes_global
    const factsDb = await db
      .select()
      .from(hermesKnowledge)
      .where(
        or(
          eq(hermesKnowledge.organizationId, slug),
          eq(hermesKnowledge.organizationId, orgId),
          eq(hermesKnowledge.organizationId, `org_${slug}`),
          eq(hermesKnowledge.organizationId, 'hermes_global')
        )
      )
      .orderBy(desc(hermesKnowledge.updatedAt));

    // 2. Sources from knowledgeSources: tenant specific
    const sourcesDb = await db
      .select()
      .from(knowledgeSources)
      .where(
        or(
          eq(knowledgeSources.tenantId, slug),
          eq(knowledgeSources.tenantId, orgId),
          eq(knowledgeSources.tenantId, `org_${slug}`)
        )
      )
      .orderBy(desc(knowledgeSources.createdAt));

    const facts: KnowledgeFactDTO[] = factsDb.map((f) => ({
      id: f.id,
      dimension: f.dimension,
      key: f.key,
      content: f.content || '',
      status: f.status as any,
      authority: f.authority,
      updatedAt: f.updatedAt.toISOString(),
    }));

    const sources: KnowledgeSourceDTO[] = sourcesDb.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    }));

    const readySources = sources.filter((s) => s.status === 'READY').length;
    const processingSources = sources.filter((s) => s.status === 'PROCESSING').length;
    const failedSources = sources.filter((s) => s.status === 'FAILED').length;

    const overview: KnowledgeOverviewView = {
      totalSources: sources.length,
      readySources,
      processingSources,
      failedSources,
      knowledgeHealth: (sources.length === 0 ? 'EMPTY' : failedSources > 0 ? 'ATTENTION_REQUIRED' : processingSources > 0 ? 'PROCESSING' : 'READY') as any,
      sources: sourcesDb.map((s) => ({
        id: s.id,
        tenantId: s.tenantId,
        title: s.title,
        type: s.type as any,
        status: s.status as any,
        activeVersionId: s.activeVersionId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastProcessedAt: s.lastProcessedAt,
        errorCode: s.errorCode,
        errorMessage: s.errorMessage,
      })),
      facts: factsDb.map((f) => ({
        id: f.id,
        dimension: f.dimension,
        key: f.key,
        content: f.content || '',
        status: (f.status === 'ACTIVE' ? 'ACTIVE' : f.status === 'REJECTED' ? 'REJECTED' : 'PENDING_REVIEW') as any,
        source: f.source,
      })),
    };

    return {
      facts,
      sources,
      overview,
      canonicalTenant: canonical,
    };
  }

  /**
   * Adds a knowledge source strictly scoped to the tenant's canonical identity.
   */
  public static async addKnowledgeSource(
    authContext: { sessionId: string; actorId: string; canonicalTenant: CanonicalTenantIdentity },
    payload: AddKnowledgeSourceRequestDTO
  ): Promise<string> {
    const { type, title, content } = payload;
    const { canonicalTenant, sessionId, actorId } = authContext;

    const cpCtx = new ControlPlaneContext(
      sessionId,
      actorId,
      'admin',
      ['view_overview', 'change_policy'],
      [{ organizationId: canonicalTenant.canonicalOrgId, role: 'admin' }]
    );

    const cmd = new CreateKnowledgeSourceCommand();
    const normalizedType: any = type === 'TEXT' ? 'DOCUMENT' : type;

    // Gate 7: Enforce trial mutation is allowed (fail-closed if expired)
    await HermesTrialPolicyService.assertTrialMutationAllowed(canonicalTenant.projectSlug);

    // Gate 3 & Mandatory Adjustment #2: Atomic Check + Reserve Quota
    const currentSourcesProvider = async () => {
      try {
        const sources = await db
          .select({ id: knowledgeSources.id })
          .from(knowledgeSources)
          .where(eq(knowledgeSources.tenantId, canonicalTenant.projectSlug));
        return sources.length;
      } catch {
        return 0;
      }
    };

    // Use projectSlug as the relational storage key for knowledgeSources / knowledgeChunks
    const sourceId = await HermesTrialPolicyService.atomicCheckAndReserveQuota(
      canonicalTenant.projectSlug,
      'knowledge',
      currentSourcesProvider,
      async () => {
        return await cmd.execute(cpCtx, canonicalTenant.projectSlug, {
          type: normalizedType,
          content,
          title,
        });
      }
    );

    // Gate 8: Record KNOWLEDGE_ADDED in Trial Timeline
    try {
      await HermesTrialTimelineService.recordEvent(canonicalTenant.projectSlug, 'KNOWLEDGE_ADDED', {
        actorId,
        metadata: { title, type: normalizedType, sourceId },
      });
    } catch (timelineErr) {
      console.warn('[KnowledgeService] Notice recording timeline event:', timelineErr);
    }

    return sourceId;
  }

  /**
   * Updates fact status, strictly validating tenant ownership to prevent ID tampering across tenants.
   */
  public static async updateFactStatus(
    canonicalTenant: CanonicalTenantIdentity,
    factId: string,
    status: 'ACTIVE' | 'REJECTED'
  ): Promise<boolean> {
    // Gate 7: Enforce trial mutation allowed
    await HermesTrialPolicyService.assertTrialMutationAllowed(canonicalTenant.projectSlug);

    const slug = canonicalTenant.projectSlug;
    const orgId = canonicalTenant.canonicalOrgId;

    const updated = await db
      .update(hermesKnowledge)
      .set({ status, updatedAt: new Date() })
      .where(
        and(
          eq(hermesKnowledge.id, factId),
          or(
            eq(hermesKnowledge.organizationId, slug),
            eq(hermesKnowledge.organizationId, orgId),
            eq(hermesKnowledge.organizationId, `org_${slug}`)
          )
        )
      )
      .returning({ id: hermesKnowledge.id });

    return updated.length > 0;
  }
}
