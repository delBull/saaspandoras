"use server";

import { revalidatePath } from 'next/cache';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { CreateKnowledgeSourceCommand } from '@/lib/pandoras/core/domains/control-plane/application/commands/knowledge/create-knowledge-source';

import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';

export async function addKnowledgeAction(organizationSlug: string, type: any, content: string, title: string) {
  const portalCtx = await resolvePortalContext(organizationSlug);
  if (!portalCtx) throw new Error("Unauthorized");

  const cpCtx = new ControlPlaneContext(
    portalCtx.tenant.sessionId,
    portalCtx.tenant.actorId,
    portalCtx.tenant.role as any,
    portalCtx.tenant.permissions as any,
    [{ organizationId: portalCtx.tenant.organizationId, role: portalCtx.tenant.role as any }]
  );

  const cmd = new CreateKnowledgeSourceCommand();
  await cmd.execute(cpCtx, portalCtx.tenant.organizationId, { type, content, title });

  revalidatePath(`/portal/${organizationSlug}/knowledge`);
}
