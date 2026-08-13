import { db } from '@/db';
import { knowledgeSources, knowledgeSourceVersions } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { ControlPlaneContext } from '../../context';
import { knowledgeRuntime } from '../../../../knowledge/knowledge-runtime';
import { nanoid } from 'nanoid';

export interface UpdateKnowledgeSourceInput {
  content: string;
}

export class UpdateKnowledgeSourceCommand {
  async execute(ctx: ControlPlaneContext, organizationId: string, sourceId: string, input: UpdateKnowledgeSourceInput): Promise<string> {
    const scope = ctx.requireOrganizationScope(organizationId);

    // 1. Verify Source exists and belongs to tenant
    const [source] = await db.select().from(knowledgeSources).where(
      and(
        eq(knowledgeSources.id, sourceId),
        eq(knowledgeSources.tenantId, scope.organizationId)
      )
    ).limit(1);

    if (!source) throw new Error('Source not found or unauthorized');

    // 2. Determine new version number
    const [latestVersion] = await db.select({ version: knowledgeSourceVersions.version })
      .from(knowledgeSourceVersions)
      .where(eq(knowledgeSourceVersions.sourceId, sourceId))
      .orderBy(desc(knowledgeSourceVersions.version))
      .limit(1);

    const newVersionNumber = (latestVersion?.version || 0) + 1;
    const versionId = nanoid();

    // 3. Create New Version
    await db.insert(knowledgeSourceVersions).values({
      id: versionId,
      sourceId,
      tenantId: scope.organizationId,
      version: newVersionNumber,
      content: input.content,
      status: 'CREATED',
      createdBy: ctx.actorId || 'system',
    });

    // 4. Trigger Runtime Processing Asynchronously
    knowledgeRuntime.processVersion(scope.organizationId, sourceId, versionId).catch(console.error);

    return versionId;
  }
}
