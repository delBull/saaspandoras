import { db } from '@/db';
import { knowledgeSources, hermesKnowledge } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
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
    let records: any[] = [];
    let knowledgeRecords: any[] = [];
    try {
      records = await db.select().from(knowledgeSources).where(eq(knowledgeSources.tenantId, orgSlug));
      knowledgeRecords = await db.select().from(hermesKnowledge)
        .where(
          eq(hermesKnowledge.organizationId, orgSlug)
        );
    } catch (error) {
      console.warn('[GetKnowledgeOverviewQuery] Error querying knowledge sources (table might be missing):', error);
      // Return empty array to prevent 500 error on the UI
    }
    
    const totalSources = records.length;
    const readySources = records.filter(r => r.status === 'READY').length;
    const processingSources = records.filter(r => r.status === 'PROCESSING' || r.status === 'CREATED').length;
    const failedSources = records.filter(r => r.status === 'FAILED').length;
    
    let knowledgeHealth: KnowledgeOverviewView['knowledgeHealth'] = 'READY';
    if (totalSources === 0 && knowledgeRecords.length === 0) knowledgeHealth = 'EMPTY';
    else if (failedSources > 0) knowledgeHealth = 'ATTENTION_REQUIRED';
    else if (processingSources > 0) knowledgeHealth = 'PROCESSING';
    
    const sources: KnowledgeSourceView[] = records.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type as any,
      status: r.status as any,
      version: 1, // Simplified for overview
      lastUpdated: r.updatedAt,
      lastProcessedAt: r.lastProcessedAt,
      canRetry: r.status === 'FAILED'
    }));

    const facts: KnowledgeFactView[] = knowledgeRecords
      .filter(r => ['knowledge', 'business_info', 'DOMAIN', 'IDENTITY', 'policy'].includes(r.dimension))
      .map(r => ({
        id: r.id,
        dimension: r.dimension,
        key: r.key,
        content: r.content,
        status: r.status as any,
        source: r.sourceReference || r.source || 'Unknown'
      }));

    return {
      totalSources,
      readySources,
      processingSources,
      failedSources,
      knowledgeHealth,
      sources,
      facts
    };
  }
}
