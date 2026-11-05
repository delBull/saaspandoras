import { db } from '@saasfly/db-core';
import { knowledgeSources, knowledgeSourceVersions } from '@saasfly/db-core/schema';
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

    // 3. Process the version in the same request lifecycle.
    // Previously this was fire-and-forget (`.catch(console.error)`), which in serverless
    // could be killed after the response and silently left sources stuck in CREATED.
    // The runtime is fail-closed: it marks the source FAILED and rethrows, so the caller
    // (API → UI) receives the real outcome instead of a fabricated success.
    await knowledgeRuntime.processVersion(scope.organizationId, sourceId, versionId);

    return sourceId;
  }
}
