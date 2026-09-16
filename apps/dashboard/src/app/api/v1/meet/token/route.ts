import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meetings, meetingParticipants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JITSI_APP_ID = process.env.JITSI_APP_ID;
const JITSI_API_KEY = process.env.JITSI_API_KEY;
const JITSI_PRIVATE_KEY_B64 = process.env.JITSI_PRIVATE_KEY_B64; // The base64 encoded .pk file

export async function POST(req: NextRequest) {
  try {
    if (!JITSI_APP_ID || !JITSI_API_KEY || !JITSI_PRIVATE_KEY_B64) {
      console.error("[Sovereign Meet] Missing JaaS configuration");
      return NextResponse.json({ error: "Sovereign Meet is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { meetingId, identityId, isGuest } = body;

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    // 1. Fetch meeting and check status
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId));

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.status === "cancelled" || meeting.status === "ended") {
      return NextResponse.json({ error: "Meeting is no longer active" }, { status: 403 });
    }

    // 2. Resolve Participant Policy
    let role = "guest";
    let participantName = "Guest";
    let participantEmail = "";
    
    // In a real implementation we would resolve the identity and participant mapping here.
    // For MVP we assume the client provides identity context and we will harden it later.
    // The policy check should ensure that the canonicalOrgId matches the user's tenant if they are a collaborator.
    
    if (!isGuest && identityId) {
       // Validate collaborator or registered user
       const [participant] = await db
         .select()
         .from(meetingParticipants)
         .where(
           and(
             eq(meetingParticipants.meetingId, meetingId),
             eq(meetingParticipants.identityId, identityId)
           )
         );
       
       if (participant) {
         role = participant.role;
         participantName = `Participant ${identityId.substring(0, 5)}`; // Mocked resolution
       } else {
         return NextResponse.json({ error: "Not authorized for this meeting" }, { status: 403 });
       }
    } else {
       // Anonymous guests can join if the meeting allows it (policy TBD, for MVP we allow it as "guest")
       role = "guest";
       participantName = "Anonymous Guest";
    }

    // 3. Generate Jitsi JWT
    const privateKey = Buffer.from(JITSI_PRIVATE_KEY_B64, 'base64').toString('utf8');
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      aud: "jitsi",
      iss: "chat",
      sub: JITSI_APP_ID,
      room: meetingId,
      nbf: now - 30, // valid since 30 secs ago
      exp: now + (4 * 3600), // valid for 4 hours
      context: {
        features: {
          livestreaming: role === "host",
          recording: false, // Omitted for MVP as per user specs
          transcription: false,
          "outbound-call": false
        },
        user: {
          id: identityId || `anon-${crypto.randomUUID()}`,
          name: participantName,
          email: participantEmail,
          moderator: role === "host" || role === "co_host",
        }
      }
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      keyid: JITSI_API_KEY
    });

    return NextResponse.json({
      token,
      roomName: meetingId,
      appId: JITSI_APP_ID,
      role
    });

  } catch (error) {
    console.error("[Sovereign Meet] Token Error:", error);
    return NextResponse.json({ error: "Failed to generate access token" }, { status: 500 });
  }
}
