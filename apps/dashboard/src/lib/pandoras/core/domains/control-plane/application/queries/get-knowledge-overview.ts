import { db } from '@/db';
import { knowledgeSources } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { ControlPlaneContext } from '../context';
import type { KnowledgeSourceView } from '../../view-models';

export interface KnowledgeOverviewView {
  totalSources: number;
  readySources: number;
  processingSources: number;
  failedSources: number;
  knowledgeHealth: 'READY' | 'PROCESSING' | 'ATTENTION_REQUIRED' | 'EMPTY';
  sources: KnowledgeSourceView[];
}

export class GetKnowledgeOverviewQuery {
  async execute(ctx: ControlPlaneContext, organizationId: string): Promise<KnowledgeOverviewView> {
    const scope = ctx.requireOrganizationScope(organizationId);
    const records = await db.select().from(knowledgeSources).where(eq(knowledgeSources.tenantId, scope.organizationId));
    
    const totalSources = records.length;
    const readySources = records.filter(r => r.status === 'READY').length;
    const processingSources = records.filter(r => r.status === 'PROCESSING' || r.status === 'CREATED').length;
    const failedSources = records.filter(r => r.status === 'FAILED').length;
    
    let knowledgeHealth: KnowledgeOverviewView['knowledgeHealth'] = 'READY';
    if (totalSources === 0) knowledgeHealth = 'EMPTY';
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

    return {
      totalSources,
      readySources,
      processingSources,
      failedSources,
      knowledgeHealth,
      sources
    };
  }
}
