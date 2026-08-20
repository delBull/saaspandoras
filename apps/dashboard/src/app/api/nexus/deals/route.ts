import { NextResponse } from "next/server";
import { validateDealRoomAccess } from "@/lib/admin-auth";
import { listRooms, createRoom } from "@/lib/nexus-deals/repo";
import { DealKind } from "@/lib/nexus-deals/types";
import { sendDealRoomAlert } from "@/lib/nexus-deals/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: DealKind[] = ["PROPOSAL", "AGREEMENT", "CONTRACT", "AMENDMENT", "CHARTER"];

export async function GET(request: Request) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;
  try {
    const rooms = await listRooms();
    return NextResponse.json({ rooms });
  } catch (e: any) {
    console.error("❌ [Deals] list error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;
  const actor = session!.address;

  try {
    const body = await request.json();
    const kind: DealKind = KINDS.includes(body.kind) ? body.kind : "PROPOSAL";
    const counterparty = String(body.counterparty ?? "").trim();
    if (!counterparty) {
      return NextResponse.json({ error: "counterparty es requerida" }, { status: 400 });
    }

    const room = await createRoom({
      title: String(body.title ?? "").trim() || undefined,
      kind,
      counterparty,
      relation: String(body.relation ?? "").trim() || undefined,
      company: String(body.company ?? "").trim() || undefined,
      summary: String(body.summary ?? "").trim() || undefined,
      note: String(body.note ?? "").trim() || undefined,
      taskRef: String(body.taskRef ?? "").trim() || undefined,
      signers: Array.isArray(body.signers)
        ? body.signers.map((s: any) => ({ email: String(s.email ?? "") }))
        : undefined,
      actor,
    });

    await sendDealRoomAlert({
      roomLabel: `${room!.publicId} · ${room!.counterparty}`,
      action: "Deal Room creado",
      actor,
      detail: `${kind} · link público auto-generado: ${room!.publicId}`,
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (e: any) {
    console.error("❌ [Deals] create error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
