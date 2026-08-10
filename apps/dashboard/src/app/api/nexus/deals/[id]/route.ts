import { NextResponse } from "next/server";
import { validateDealRoomAccess } from "@/lib/admin-auth";
import { getRoom, updateRoom, updateSection, deleteRoom, addSigners, removeSigner, addSection, convertToAgreement } from "@/lib/nexus-deals/repo";
import { DealKind } from "@/lib/nexus-deals/types";
import { sendDealRoomAlert } from "@/lib/nexus-deals/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: DealKind[] = ["PROPOSAL", "AGREEMENT", "CONTRACT", "AMENDMENT", "CHARTER"];

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;
  try {
    const room = await getRoom(params.id);
    if (!room) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });
    return NextResponse.json({ room });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;
  const actor = session!.address;

  try {
    const room = await getRoom(params.id);
    if (!room) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });

    const body = await request.json();
    let updated = room;

    if (body.sectionCode && typeof body.content === "string") {
      const after = await updateSection(params.id, String(body.sectionCode), body.content, actor);
      if (!after) return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
      updated = after;
    } else if (body.addSection === true) {
      updated = (await addSection(params.id, actor))!;
    } else if (body.convertAgreement === true) {
      updated = (await convertToAgreement(params.id, actor))!;
    } else {
      const patch: Record<string, unknown> = { id: params.id, actor };
      if (KINDS.includes(body.kind)) patch.kind = body.kind;
      if (typeof body.counterparty === "string") patch.counterparty = body.counterparty.trim();
      if (typeof body.relation === "string") patch.relation = body.relation.trim();
      if (typeof body.company === "string") patch.company = body.company.trim();
      if (typeof body.summary === "string") patch.summary = body.summary.trim();
      if (typeof body.status === "string") patch.status = body.status;
      if (typeof body.taskRef === "string") patch.taskRef = body.taskRef.trim();
      if (typeof body.openSign === "boolean") patch.openSign = body.openSign;
      const after = await updateRoom(patch as any);
      updated = after!;
    }

    if (Array.isArray(body.signers) && body.signers.length > 0) {
      updated = (await addSigners(params.id, body.signers.map((s: any) => String(s.email ?? "")), actor))!;
    }
    if (typeof body.removeSignerId === "string") {
      updated = (await removeSigner(params.id, body.removeSignerId, actor))!;
    }

    return NextResponse.json({ room: updated });
  } catch (e: any) {
    console.error("❌ [Deals] patch error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;
  const actor = session!.address;

  try {
    const room = await getRoom(params.id);
    if (!room) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });
    await deleteRoom(params.id, actor);
    await sendDealRoomAlert({
      roomLabel: `${room.publicId} · ${room.counterparty}`,
      action: "Deal Room eliminado",
      actor,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
