import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusDealPods } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { requirePodActor } from "@/lib/nexus/pod-auth";
import { listAccessRequests } from "@/lib/nexus/deal-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/nexus/pods/[id]/access-requests` — bandeja del pod.
 *
 * Aislada por `pod_id` **y** organización: son solicitudes de la categoría
 * Deal Pod, no leads del CRM ni de marketing.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  const podId = (await params).id;
  const [pod] = await db
    .select({ id: nexusDealPods.id })
    .from(nexusDealPods)
    .where(and(eq(nexusDealPods.id, podId), eq(nexusDealPods.canonicalOrgId, actor!.canonicalOrgId)))
    .limit(1);

  if (!pod) return NextResponse.json({ error: "Pod no encontrado." }, { status: 404 });

  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  const requests = await listAccessRequests({
    orgId: actor!.canonicalOrgId,
    podId,
    status: status ?? undefined,
    limit: 100,
  });

  const pending = requests.filter((item) => item.status === "PENDING").length;
  return NextResponse.json({ requests, pending });
}
