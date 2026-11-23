import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusOutreachLinks, nexusProspects } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { requirePodActor } from "@/lib/nexus/pod-auth";
import { createOutreachLink, radarBaseUrl } from "@/lib/nexus/outreach-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `POST /api/nexus/prospects/[id]/approve` — aprueba y genera la semilla.
 *
 * - Idempotente: si ya estaba aprobado con link, devuelve el mismo.
 * - Sin pod no hay link (el módulo funciona sin pod); se marca aprobado y se
 *   informa `url: null` en lugar de inventar una URL.
 * - Nunca envía correo: sólo prepara el link del radar para el primer toque
 *   humano.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const orgId = actor!.canonicalOrgId;
  const [prospect] = await db
    .select()
    .from(nexusProspects)
    .where(and(eq(nexusProspects.id, (await params).id), eq(nexusProspects.canonicalOrgId, orgId)))
    .limit(1);

  if (!prospect) return NextResponse.json({ error: "Prospecto no encontrado." }, { status: 404 });

  if (prospect.status === "APPROVED" && prospect.linkId) {
    const [link] = await db
      .select()
      .from(nexusOutreachLinks)
      .where(eq(nexusOutreachLinks.id, prospect.linkId))
      .limit(1);
    if (link) {
      return NextResponse.json({
        prospect,
        link,
        url: `${radarBaseUrl()}/l/${link.code}`,
        alreadyApproved: true,
      });
    }
  }

  if (!prospect.podId) {
    const [updated] = await db
      .update(nexusProspects)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(eq(nexusProspects.id, prospect.id))
      .returning();
    return NextResponse.json({
      prospect: updated,
      link: null,
      url: null,
      warning: "El prospecto no está ligado a un Deal Pod: no se generó link de radar.",
    });
  }

  const targetLabel =
    (typeof body.targetLabel === "string" ? body.targetLabel.trim() : "") ||
    [prospect.personName, prospect.company].filter(Boolean).join(" · ") ||
    prospect.email ||
    `Prospecto ${prospect.id.slice(0, 8)}`;

  const first = await createOutreachLink({
    podId: prospect.podId,
    orgId,
    targetLabel,
    targetOrg: prospect.company,
    targetRole: prospect.role,
    door: prospect.door,
    code: typeof body.code === "string" ? body.code : null,
  });

  let result = first;
  if (!result.ok && result.status === 409) {
    // Código tomado: se reintenta con sufijo corto y estable por prospecto.
    result = await createOutreachLink({
      podId: prospect.podId,
      orgId,
      targetLabel,
      targetOrg: prospect.company,
      targetRole: prospect.role,
      door: prospect.door,
      code: `${targetLabel}-${prospect.id.slice(0, 4)}`,
    });
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const [updated] = await db
    .update(nexusProspects)
    .set({ status: "APPROVED", linkId: result.link.id, updatedAt: new Date() })
    .where(eq(nexusProspects.id, prospect.id))
    .returning();

  return NextResponse.json({ prospect: updated, link: result.link, url: result.url });
}
