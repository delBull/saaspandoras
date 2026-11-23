import { NextResponse } from "next/server";
import { requirePodActor } from "@/lib/nexus/pod-auth";
import { listProspects, prospectCounts } from "@/lib/prospecting/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/nexus/prospects` — bandeja de aprobación.
 *
 * Filtros: ?status=NEW|APPROVED|REJECTED|CONTACTED · ?door= · ?podId= · ?jobId=
 *          ?minConfidence= · ?limit=
 * Siempre acotado a la organización del actor: el `podId` del query no autoriza.
 */
export async function GET(req: Request) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  const url = new URL(req.url);
  const orgId = actor!.canonicalOrgId;

  const [prospects, counts] = await Promise.all([
    listProspects({
      orgId,
      status: url.searchParams.get("status") ?? undefined,
      door: url.searchParams.get("door") ?? undefined,
      podId: url.searchParams.get("podId") ?? undefined,
      jobId: url.searchParams.get("jobId") ?? undefined,
      minConfidence: url.searchParams.has("minConfidence")
        ? Number.parseInt(url.searchParams.get("minConfidence") ?? "", 10) || 0
        : undefined,
      limit: Number.parseInt(url.searchParams.get("limit") ?? "100", 10) || 100,
    }),
    prospectCounts(orgId),
  ]);

  return NextResponse.json({ prospects, counts });
}
