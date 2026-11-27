import { NextResponse } from "next/server";
import { getNexusAuthContext } from '@saasfly/shared';
import { getApprovals } from "@/lib/nexus/operations-repo";
import { resolveCampaignApproval } from "@/lib/growth/campaign-approval";
import { publishCommunityProposal } from "@saasfly/hermes-core";
import { resolvePortalContext } from "@/lib/portal/resolve-portal-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Puerta doble de las aprobaciones.
 *
 * 1. **Nexus** (wallet/admin): puede resolver en cualquier tenant si es
 *    SUPER_ADMIN/ADMIN; el resto queda limitado a su `canonicalOrgId`.
 * 2. **Sesión de portal** (cookie del tenant): sólo el owner/admin de ESA
 *    organización, y siempre acotado a ella. Es el caso de un tenant que no
 *    tiene wallet conectada: la bandeja se ve, pero antes el PATCH devolvía 401
 *    porque sólo se aceptaba Nexus.
 *
 * En ningún caso el cliente decide la organización: la sesión de portal fija el
 * `orgId` server-side y la actualización lleva `canonical_org_id = orgId` en el
 * WHERE (salvo super admin).
 */
async function resolveApprovalActor(request: Request, organizationSlug: string | null): Promise<
  | {
      ok: true;
      orgId: string;
      isSuperAdmin: boolean;
      /** FK numérica (sólo colaboradores Nexus); el portal no tiene colaborador. */
      collaboratorId: number | null;
      /** Identidad legible para auditoría: `collaborator:<id>`, `wallet:…` o `portal:…`. */
      actorLabel: string | null;
    }
  | { ok: false; status: 401 | 403; error: string }
> {
  const nexus = await getNexusAuthContext(request.headers).catch(() => null);
  if (nexus?.isAuthenticated) {
    const canManage = nexus.permissions['nexus.manage'] || nexus.permissions.dealRoom;
    if (!canManage) return { ok: false, status: 403, error: 'Forbidden' };
    return {
      ok: true,
      orgId: nexus.canonicalOrgId || 'pandoras',
      isSuperAdmin: nexus.role === 'SUPER_ADMIN' || nexus.role === 'ADMIN',
      collaboratorId: nexus.collaboratorId ?? null,
      actorLabel: nexus.collaboratorId ? `collaborator:${nexus.collaboratorId}` : null,
    };
  }

  if (organizationSlug) {
    try {
      const ctx = await resolvePortalContext(organizationSlug);
      if (ctx.tenant.role !== 'owner' && ctx.tenant.role !== 'admin') {
        return { ok: false, status: 403, error: 'Sólo el owner de la organización puede resolver aprobaciones.' };
      }
      return {
        ok: true,
        orgId: ctx.organization.slug,
        isSuperAdmin: false,
        collaboratorId: null,
        actorLabel: ctx.tenant.actorId ? `portal:${ctx.tenant.actorId}` : 'portal:owner',
      };
    } catch (err: any) {
      const code = err?.code;
      if (code === 'NO_SESSION' || code === 'INVALID_SESSION') {
        return { ok: false, status: 401, error: 'Unauthorized' };
      }
      // Sesión válida pero sin acceso a esa organización.
      return { ok: false, status: 403, error: 'Sin acceso a esta organización.' };
    }
  }

  return { ok: false, status: 401, error: 'Unauthorized' };
}

export async function GET(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Approval center is usually tied to nexus.manage or specific high roles
    if (!auth.permissions['nexus.manage'] && !auth.permissions.dealRoom) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const orgId = auth.canonicalOrgId || 'pandoras';

    /**
     * La consola de Nexus es para **operación interna**. Las aprobaciones del
     * tenant (media/redes) se revisan en el Growth OS del tenant, no aquí.
     */
    const requestedScope = new URL(request.url).searchParams.get('scope') ?? 'internal';
    const scope = (['internal', 'tenant', 'deal'].includes(requestedScope) ? requestedScope : 'internal') as
      | 'internal'
      | 'tenant'
      | 'deal';

    const approvals = await getApprovals(orgId, scope);

    /**
     * Las aprobaciones de contenido necesitan **verse**: texto, plataforma e
     * imagen/carrusel. Sin esto, el aprobador decidía a ciegas sobre un post que
     * no podía previsualizar.
     */
    const communityApprovalIds = approvals
      .filter((a) => typeof a.what === 'string' && a.what.startsWith('community.publish_post:'))
      .map((a) => a.id);

    let postsByApproval = new Map<string, Array<{ channel: string; text: string; imageUrl?: string; platform?: string }>>();
    if (communityApprovalIds.length > 0) {
      const { db } = await import('@saasfly/db-core');
      const { communityProposals } = await import('@saasfly/db-core/schema');
      const { inArray } = await import('@saasfly/db-core');

      const rows = await db
        .select({ approvalId: communityProposals.approvalId, posts: communityProposals.posts })
        .from(communityProposals)
        .where(inArray(communityProposals.approvalId, communityApprovalIds));

      postsByApproval = new Map(
        rows
          .filter((row) => row.approvalId)
          .map((row) => [
            String(row.approvalId),
            (row.posts ?? []).map((post) => ({
              channel: String(post.channel ?? ''),
              text: String(post.text ?? ''),
              ...(post.imageUrl ? { imageUrl: String(post.imageUrl) } : {}),
              ...(Array.isArray(post.imageUrls) && post.imageUrls.length > 0
                ? { imageUrls: post.imageUrls.map(String) }
                : {}),
              ...(post.platform ? { platform: String(post.platform) } : {}),
            })),
          ]),
      );
    }

    return NextResponse.json({
      approvals: approvals.map((a) => ({
        ...a,
        ...(postsByApproval.has(a.id) ? { posts: postsByApproval.get(a.id) } : {}),
      })),
    });
  } catch (err: any) {
    console.error("[Approvals] GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const organizationSlug =
      typeof body.organizationSlug === 'string' ? body.organizationSlug.trim() : null;

    const actor = await resolveApprovalActor(request, organizationSlug);
    if (!actor.ok) {
      return NextResponse.json({ error: actor.error }, { status: actor.status });
    }

    const orgId = actor.orgId;
    const isSuperAdmin = actor.isSuperAdmin;
    const { id, action } = body as { id?: string; action?: string };

    if (!id || !action || !['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: "id and action ('APPROVED' | 'REJECTED') are required" }, { status: 400 });
    }

    const { db } = await import('@saasfly/db');
    const { nexusApprovals } = await import('@saasfly/db/schema');
    const { eq, and } = await import('@saasfly/db-core');

    const [updated] = await db
      .update(nexusApprovals)
      .set({
        status: action as any,
        resolvedBy: actor.collaboratorId,
        resolvedAt: new Date(),
      })
      // El dueño de la plataforma resuelve aprobaciones de cualquier tenant; el resto,
      // sólo las de su propia organización.
      .where(and(eq(nexusApprovals.id, id), ...(isSuperAdmin ? [] : [eq(nexusApprovals.canonicalOrgId, orgId)])))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Approval request not found in this organization scope" }, { status: 404 });
    }

    // Si la aprobación era de una campaña, se aplica aquí (programar o rechazar).
    try {
      await resolveCampaignApproval({
        organizationSlug: orgId,
        what: updated.what,
        status: action as "APPROVED" | "REJECTED",
        resolvedBy: actor.actorLabel,
      });
    } catch (err: any) {
      console.warn("[Approvals] no se pudo aplicar a la campaña:", err?.message || err);
    }

    // Fase 2 (ADR-019): propuestas de comunidad → publicar (o rechazar) de verdad.
    let community: Awaited<ReturnType<typeof publishCommunityProposal>> | null = null;
    if (typeof updated.what === "string" && updated.what.startsWith("community.publish_post:")) {
      try {
        community = await publishCommunityProposal({
          approvalId: updated.id,
          decision: action as "APPROVED" | "REJECTED",
          resolvedBy: actor.actorLabel,
          reason: typeof body.reason === "string" ? body.reason : null,
        });
      } catch (err: any) {
        console.warn("[Approvals] fallo al publicar la propuesta de comunidad:", err?.message || err);
      }
    }

    return NextResponse.json({ success: true, approval: updated, community });
  } catch (err: any) {
    console.error("[Approvals] PATCH Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PATCH(request);
}

