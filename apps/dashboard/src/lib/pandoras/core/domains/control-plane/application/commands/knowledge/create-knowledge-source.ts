import { db } from '@/db';
import { knowledgeSources, knowledgeSourceVersions } from '@/db/schema';
import type { ControlPlaneContext } from '../../context';
import { knowledgeRuntime } from '../../../../knowledge/knowledge-runtime';
import { nanoid } from 'nanoid';

export interface CreateKnowledgeSourceInput {
  title: string;
  type: 'DOCUMENT' | 'URL' | 'FAQ' | 'BUSINESS_INFO' | 'BUSINESS_RULE';
  content: string;
}

export class CreateKnowledgeSourceCommand {
  async execute(ctx: ControlPlaneContext, organizationId: string, input: CreateKnowledgeSourceInput): Promise<string> {
    const scope = ctx.requireOrganizationScope(organizationId);
    const sourceId = nanoid();
    const versionId = nanoid();

    // 1. Create Source in CREATED state
    await db.insert(knowledgeSources).values({
      id: sourceId,
      tenantId: scope.organizationId,
      title: input.title,
      type: input.type,
      status: 'CREATED',
    });

    // 2. Create Version 1 in CREATED state
    await db.insert(knowledgeSourceVersions).values({
      id: versionId,
      sourceId,
      tenantId: scope.organizationId,
      version: 1,
      content: input.content,
      status: 'CREATED',
      createdBy: ctx.actorId || 'system',
    });

    // 3. Trigger Runtime Processing Asynchronously
    // In a real distributed system this would be an event (PlatformEventBus).
    // For Phase 6.4 MVP, we execute it concurrently without awaiting.
    knowledgeRuntime.processVersion(scope.organizationId, sourceId, versionId).catch(console.error);

    return sourceId;
  }
}
