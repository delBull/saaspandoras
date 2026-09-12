import { NextResponse } from "next/server";
import { validateDealRoomAccess } from "@/lib/admin-auth";
import {
  getRoom,
  shareDealWithCollaborator,
  unshareDealWithCollaborator,
  canUserAccessDeal,
  canUserEditDeal,
  isUserCreatorOfDeal,
  resolveRoomCreator,
} from "@/lib/nexus-deals/repo";
import { db } from "@/db";
import { nexusCollaborators } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;

  try {
    const roomId = (await params).id;
    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });
    }

    const isSuperAdmin = session?.role === "SUPER_ADMIN";
    const userIdentifier = session?.address || session?.userId || "";
    const email = session?.email;

    if (!canUserAccessDeal(room, userIdentifier, email, isSuperAdmin)) {
      return NextResponse.json({ error: "No tienes permiso para ver este deal." }, { status: 403 });
    }

    // Retrieve active team members from Nexus to easily select in the UI
    const activeTeam = await db
      .select({
        id: nexusCollaborators.id,
        name: nexusCollaborators.name,
        email: nexusCollaborators.email,
        role: nexusCollaborators.role,
      })
      .from(nexusCollaborators)
      .where(ne(nexusCollaborators.status, "REJECTED"));

    const creator = resolveRoomCreator(room);
    const sharedWith = (room.sharedWith as Array<{ email: string; name?: string; sharedAt: string; sharedBy: string }>) || [];

    return NextResponse.json({
      ok: true,
      creator,
      isCreator: isUserCreatorOfDeal(room, userIdentifier, email),
      sharedWith,
      availableCollaborators: activeTeam,
    });
  } catch (e: any) {
    console.error("❌ [Deals Collaborators] GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;

  const isSuperAdmin = session?.role === "SUPER_ADMIN";
  const userIdentifier = session?.address || session?.userId || "";
  const email = session?.email;
  const actor = email || userIdentifier || session?.name || "Nexus Ops";

  try {
    const roomId = (await params).id;
    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });
    }

    if (!canUserEditDeal(room, userIdentifier, email, isSuperAdmin)) {
      return NextResponse.json({ error: "Solo el creador o colaboradores con acceso pueden compartir este deal." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetEmail = String(body.email ?? "").trim().toLowerCase();
    const targetName = body.name ? String(body.name).trim() : undefined;

    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json({ error: "Email de colaborador inválido." }, { status: 400 });
    }

    const updated = await shareDealWithCollaborator(roomId, { email: targetEmail, name: targetName }, actor);
    return NextResponse.json({ ok: true, room: updated });
  } catch (e: any) {
    console.error("❌ [Deals Collaborators] POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;

  const isSuperAdmin = session?.role === "SUPER_ADMIN";
  const userIdentifier = session?.address || session?.userId || "";
  const email = session?.email;
  const actor = email || userIdentifier || session?.name || "Nexus Ops";

  try {
    const roomId = (await params).id;
    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });
    }

    // Only creator or superadmin can revoke sharing access
    const isCreator = isUserCreatorOfDeal(room, userIdentifier, email);
    if (!isCreator && !isSuperAdmin) {
      return NextResponse.json({ error: "Solo el creador original o SuperAdmin puede revocar accesos." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetEmail = String(body.email ?? "").trim().toLowerCase();

    if (!targetEmail) {
      return NextResponse.json({ error: "Email de colaborador es requerido." }, { status: 400 });
    }

    const updated = await unshareDealWithCollaborator(roomId, targetEmail, actor);
    return NextResponse.json({ ok: true, room: updated });
  } catch (e: any) {
    console.error("❌ [Deals Collaborators] DELETE error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
