import { NextResponse } from "next/server";
import { requirePodActor } from "@/lib/nexus/pod-auth";
import { createOutreachLink } from "@/lib/nexus/outreach-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `POST /api/nexus/pods/[id]/links` — crea una semilla con su link de radar.
 *
 * Body: { targetLabel, targetOrg?, targetRole?, door?, code? }
 * Si no llega `code`, se deriva del target. Devuelve `url` lista para copiar.
 *
 * La creación vive en `lib/nexus/outreach-links.ts` para que la aprobación de un
 * prospecto use exactamente el mismo camino (un solo lugar donde se decide el
 * código, el pod y la URL).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const podId = (await params).id;
  const result = await createOutreachLink({
    podId,
    orgId: actor!.canonicalOrgId,
    targetLabel: typeof body.targetLabel === "string" ? body.targetLabel : "",
    targetOrg: typeof body.targetOrg === "string" ? body.targetOrg : null,
    targetRole: typeof body.targetRole === "string" ? body.targetRole : null,
    door: typeof body.door === "string" ? body.door : null,
    code: typeof body.code === "string" ? body.code : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ link: result.link, url: result.url }, { status: 201 });
}
