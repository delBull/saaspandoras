import { db } from '@/db';
import { knowledgeSources, hermesKnowledge, hermesKnowledgeRegistry, projects } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import type { ControlPlaneContext } from '../context';
import type { KnowledgeSourceView } from '../../view-models';

export interface KnowledgeFactView {
  id: string;
  dimension: string;
  key: string;
  content: string;
  status: 'ACTIVE' | 'PENDING_REVIEW' | 'REJECTED' | 'SUPERSEDED';
  source: string;
}

export interface KnowledgeOverviewView {
  totalSources: number;
  readySources: number;
  processingSources: number;
  failedSources: number;
  knowledgeHealth: 'READY' | 'PROCESSING' | 'ATTENTION_REQUIRED' | 'EMPTY';
  sources: KnowledgeSourceView[];
  facts: KnowledgeFactView[];
}

export class GetKnowledgeOverviewQuery {
  async execute(ctx: ControlPlaneContext, organizationId: string): Promise<KnowledgeOverviewView> {
    const scope = ctx.requireOrganizationScope(organizationId);
    const orgSlug = scope.organizationId.replace(/^org_/, '');
    const canonicalOrgId = scope.organizationId;

    let records: any[] = [];
    let knowledgeRecords: any[] = [];
    let registryRecords: any[] = [];

    try {
      // Resolve human-readable project slug from UUID if necessary
      let projectSlug = orgSlug;
      try {
        const proj = await db.query.projects.findFirst({
          where: or(
            eq(projects.organizationId, canonicalOrgId),
            eq(projects.slug, canonicalOrgId),
            eq(projects.slug, orgSlug)
          ),
          columns: { slug: true, organizationId: true },
        });
        if (proj?.slug) projectSlug = proj.slug;
      } catch {}

      records = await db.select().from(knowledgeSources).where(
        or(
          eq(knowledgeSources.tenantId, orgSlug),
          eq(knowledgeSources.tenantId, canonicalOrgId),
          eq(knowledgeSources.tenantId, projectSlug)
        )
      );

      knowledgeRecords = await db.select().from(hermesKnowledge).where(
        or(
          eq(hermesKnowledge.organizationId, orgSlug),
          eq(hermesKnowledge.organizationId, canonicalOrgId),
          eq(hermesKnowledge.organizationId, projectSlug)
        )
      );

      registryRecords = await db.select().from(hermesKnowledgeRegistry).where(
        or(
          eq(hermesKnowledgeRegistry.tenantId, orgSlug),
          eq(hermesKnowledgeRegistry.tenantId, canonicalOrgId),
          eq(hermesKnowledgeRegistry.tenantId, projectSlug)
        )
      ).orderBy(desc(hermesKnowledgeRegistry.updatedAt));
    } catch (error) {
      console.warn('[GetKnowledgeOverviewQuery] Error querying knowledge sources:', error);
    }
    
    const totalSources = records.length + registryRecords.length;
    const readySources = records.filter(r => r.status === 'READY').length + registryRecords.length;
    const processingSources = records.filter(r => r.status === 'PROCESSING' || r.status === 'CREATED').length;
    const failedSources = records.filter(r => r.status === 'FAILED').length;
    
    let knowledgeHealth: KnowledgeOverviewView['knowledgeHealth'] = 'READY';
    if (totalSources === 0 && knowledgeRecords.length === 0) knowledgeHealth = 'EMPTY';
    else if (failedSources > 0) knowledgeHealth = 'ATTENTION_REQUIRED';
    else if (processingSources > 0) knowledgeHealth = 'PROCESSING';
    
    const sources: KnowledgeSourceView[] = [
      ...records.map(r => ({
        id: r.id,
        title: r.title,
        type: r.type as any,
        status: r.status as any,
        version: 1,
        lastUpdated: r.updatedAt,
        lastProcessedAt: r.lastProcessedAt,
        canRetry: r.status === 'FAILED',
      })),
      ...registryRecords.map(reg => ({
        id: reg.id,
        title: `${reg.domain.toUpperCase()}: ${reg.artifactId.replace(/_/g, ' ')}`,
        type: 'DOCUMENT' as const,
        status: 'READY' as const,
        version: reg.version || 1,
        lastUpdated: reg.updatedAt,
        lastProcessedAt: reg.updatedAt,
        canRetry: false,
      }))
    ];

    const facts: KnowledgeFactView[] = knowledgeRecords.map(k => ({
      id: k.id,
      dimension: k.dimension,
      key: k.key,
      content: k.content,
      status: (k.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING_REVIEW') as any,
      source: k.source || 'SOVEREIGN_VAULT',
    }));

    return {
      totalSources,
      readySources,
      processingSources,
      failedSources,
      knowledgeHealth,
      sources,
      facts,
    };
  }
}
