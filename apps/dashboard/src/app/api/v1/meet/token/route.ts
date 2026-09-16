import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JITSI_APP_ID = process.env.JITSI_APP_ID;
const JITSI_API_KEY = process.env.JITSI_API_KEY;
const JITSI_PRIVATE_KEY_B64 = process.env.JITSI_PRIVATE_KEY_B64;
const MEET_JOIN_SECRET = process.env.MEET_JOIN_SECRET;

interface JoinRefPayload {
  meetingId: string;
  collaboratorId: string;
  orgId: string;
}

export async function POST(req: NextRequest) {
  try {
    // --- Infrastructure guard ---
    if (!JITSI_APP_ID || !JITSI_API_KEY || !JITSI_PRIVATE_KEY_B64) {
      console.error("[Sovereign Meet] Missing JaaS configuration");
      return NextResponse.json({ error: "Sovereign Meet is not configured" }, { status: 500 });
    }

    if (!MEET_JOIN_SECRET) {
      console.error("[Sovereign Meet] Missing MEET_JOIN_SECRET");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const body = await req.json();
    const { ref } = body;

    if (!ref || typeof ref !== "string") {
      return NextResponse.json({ error: "Missing join reference" }, { status: 400 });
    }

    // --- 1. Verify the signed join reference (HMAC HS256) ---
    // This replaces the old pattern of accepting identityId from the client body.
    // The ref was issued server-side by /api/v1/tma/nexus/agenda with a 15-minute TTL.
    let joinPayload: JoinRefPayload;
    try {
      joinPayload = jwt.verify(ref, MEET_JOIN_SECRET, {
        algorithms: ["HS256"],
      }) as JoinRefPayload;
    } catch (err: any) {
      console.warn("[Sovereign Meet] Invalid or expired join reference:", err.message);
      return NextResponse.json(
        { error: "Join reference is invalid or has expired. Please request a new link." },
        { status: 403 }
      );
    }

    const { meetingId, collaboratorId, orgId } = joinPayload;

    // --- 2. Fetch meeting with tenant boundary check ---
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.id, meetingId),
          eq(meetings.canonicalOrgId, orgId) // cross-tenant boundary enforced by token payload
        )
      );

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.status === "cancelled" || meeting.status === "ended") {
      return NextResponse.json({ error: "Meeting is no longer active" }, { status: 403 });
    }

    // --- 3. Determine role from meeting relationship ---
    // 'guest:<meetingId>' is the collaboratorId used by /meet/[meetingId] for
    // unauthenticated leads arriving via booking confirmation links.
    const isGuestLead = collaboratorId.startsWith('guest:');
    const isHost = !isGuestLead && meeting.hostCollaboratorId === collaboratorId;
    const role = isHost ? "host" : "participant";
    const participantName = isGuestLead ? "Invitado" : `Collaborator ${collaboratorId.substring(0, 8)}`;

    // --- 4. Generate Jitsi JWT (RS256 for JaaS) ---
    const privateKey = Buffer.from(JITSI_PRIVATE_KEY_B64, "base64").toString("utf8");
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      aud: "jitsi",
      iss: "chat",
      sub: JITSI_APP_ID,
      // JaaS docs: `room` in JWT is the room name WITHOUT the appId prefix.
      // The SDK roomName prop is `${appId}/${meetingId}` — JaaS strips the prefix
      // before matching against this claim. Using '*' is also valid and allows
      // any room under this appId (safer for server-issued tokens).
      room: "*",
      nbf: now - 30,
      exp: now + 4 * 3600, // 4h Jitsi session
      context: {
        features: {
          livestreaming: isHost,
          recording: isHost, // Host can record their own sessions
          transcription: false,
          "outbound-call": false,
        },
        user: {
          id: collaboratorId,
          name: participantName,
          email: "",
          moderator: isHost,
        },
      },
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      keyid: JITSI_API_KEY,
    });

    return NextResponse.json({
      token,
      roomName: meetingId,
      appId: JITSI_APP_ID,
      role,
    });
  } catch (error) {
    console.error("[Sovereign Meet] Token Error:", error);
    return NextResponse.json({ error: "Failed to generate access token" }, { status: 500 });
  }
}
