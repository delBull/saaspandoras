import { NextResponse } from "next/server";
import { validateDealRoomAccess } from "@/lib/admin-auth";
import { getRoom, updateRoom, updateSection, deleteRoom, addSigners, removeSigner, addSection, convertToAgreement, enableNdaForRoom } from "@/lib/nexus-deals/repo";
import { DealKind } from "@/lib/nexus-deals/types";
import { sendDealRoomAlert } from "@/lib/nexus-deals/discord";
import { sendDealCancelledEmail } from "@/lib/nexus-deals/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: DealKind[] = ["PROPOSAL", "AGREEMENT", "CONTRACT", "AMENDMENT", "CHARTER"];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;
  try {
    const room = await getRoom((await params).id);
    if (!room) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });
    return NextResponse.json({ room });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;
  const actor = session!.address;

  try {
    const room = await getRoom((await params).id);
    if (!room) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });

    const body = await request.json();
    let updated = room;

    if (body.sectionCode && typeof body.content === "string") {
      const after = await updateSection((await params).id, String(body.sectionCode), body.content, actor);
      if (!after) return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
      updated = after;
    } else if (body.addSection === true) {
      updated = (await addSection((await params).id, actor))!;
    } else if (body.convertAgreement === true) {
      updated = (await convertToAgreement((await params).id, actor))!;
    } else if (typeof body.ndaEnabled === "boolean") {
      // NDA toggle — handled separately from generic updateRoom
      const phase: "before_proposal" | "after_proposal" =
        body.ndaPhase === "before_proposal" ? "before_proposal" : "after_proposal";
      await enableNdaForRoom((await params).id, body.ndaEnabled, phase, actor);
      updated = (await getRoom((await params).id))!;
    } else {
      const patch: Record<string, unknown> = { id: (await params).id, actor };
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

      if (body.status === "CANCELLED" && body.notifyCancel) {
        const KIND_LABEL: Record<string, string> = {
          PROPOSAL: "Propuesta de Colaboración",
          AGREEMENT: "Acuerdo",
          CONTRACT: "Contrato",
          AMENDMENT: "Enmienda",
          CHARTER: "Documento Fundacional",
        };
        const label = KIND_LABEL[updated.kind] || "Documento";
        for (const s of updated.signers) {
          if (s.email && s.status !== "SIGNED") {
            await sendDealCancelledEmail({
              to: s.email,
              dealKindLabel: label,
              counterparty: updated.counterparty,
              publicId: updated.publicId,
            }).catch(e => console.error("Error sending cancel email to", s.email, e));
          }
        }
      }
    }

    if (Array.isArray(body.signers) && body.signers.length > 0) {
      updated = (await addSigners((await params).id, body.signers.map((s: any) => String(s.email ?? "")), actor))!;
    }
    if (typeof body.removeSignerId === "string") {
      updated = (await removeSigner((await params).id, body.removeSignerId, actor))!;
    }

    return NextResponse.json({ room: updated });
  } catch (e: any) {
    console.error("❌ [Deals] patch error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;
  const actor = session!.address;

  try {
    const room = await getRoom((await params).id);
    if (!room) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });
    await deleteRoom((await params).id, actor);
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
