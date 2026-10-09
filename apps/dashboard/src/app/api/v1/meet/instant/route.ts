import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { meetings, nexusCollaborators } from "@saasfly/db-core/schema";
import jwt from "jsonwebtoken";

const MEET_JOIN_SECRET = process.env.MEET_JOIN_SECRET;

export async function POST(req: NextRequest) {
  try {
    if (!MEET_JOIN_SECRET) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const orgId = "pandoras"; // Default canoncial org
    
    // Fetch a valid host collaborator from the DB to avoid foreign key violations
    const [hostCollaborator] = await db
      .select({ id: nexusCollaborators.id })
      .from(nexusCollaborators)
      .limit(1)
      .catch(() => []); // fallback

    const collaboratorId = hostCollaborator?.id || 1; // Fallback to 1 if no collaborators exist
    
    // Create the meeting record
    const [meeting] = await db.insert(meetings).values({
      canonicalOrgId: orgId,
      hostCollaboratorId: collaboratorId,
      status: "scheduled",
      startsAt: new Date(),
    }).returning();

    if (!meeting) {
      throw new Error("No se pudo crear el registro de la reunión en la base de datos.");
    }

    // Generate the JWT token (joinRef)
    const joinPayload = {
      meetingId: meeting.id,
      collaboratorId: collaboratorId,
      orgId: orgId,
    };

    const joinRef = jwt.sign(joinPayload, MEET_JOIN_SECRET, {
      algorithm: "HS256",
      expiresIn: "1h",
    });

    const guestPayload = {
      meetingId: meeting.id,
      collaboratorId: `guest:${meeting.id}`,
      orgId: orgId,
    };

    const guestJoinRef = jwt.sign(guestPayload, MEET_JOIN_SECRET, {
      algorithm: "HS256",
      expiresIn: "4h",
    });

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const guestLink = `${protocol}://${host}/meet/${meeting.id}?ref=${guestJoinRef}`;

    return NextResponse.json({
      ok: true,
      meetingId: meeting.id,
      joinRef,
      guestLink,
    });
  } catch (error: any) {
    console.error("[Instant Meet Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
