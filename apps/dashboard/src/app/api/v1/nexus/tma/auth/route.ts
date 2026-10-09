import { NextResponse } from "next/server";
import crypto from "crypto";
import { db, nexusCollaborators } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_HQ || process.env.TELEGRAM_BOT_TOKEN || "";
const INIT_DATA_TTL_SECONDS = 300; // 5 minutes TTL for replay protection

function validateTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const searchParams = new URLSearchParams(initData);
    const hash = searchParams.get('hash');
    const authDateStr = searchParams.get('auth_date');
    if (!hash || !authDateStr) return false;

    // Replay protection / TTL check
    const authDate = parseInt(authDateStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > INIT_DATA_TTL_SECONDS) {
      console.warn("❌ [Nexus TMA] initData expired (TTL violation).");
      return false;
    }

    searchParams.delete('hash');
    const keys = Array.from(searchParams.keys()).sort();
    const dataCheckString = keys.map(key => `${key}=${searchParams.get(key)}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return computedHash === hash;
  } catch (err) {
    console.error("❌ [Nexus TMA] Validation error:", err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: "Missing initData" }, { status: 400 });
    }

    if (!TELEGRAM_BOT_TOKEN) {
      console.error("❌ [Nexus TMA] Missing TELEGRAM_BOT_TOKEN");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isValid = validateTelegramInitData(initData, TELEGRAM_BOT_TOKEN);
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid Telegram signature or expired" }, { status: 401 });
    }

    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) {
      return NextResponse.json({ error: "Missing user in initData" }, { status: 400 });
    }

    const tgUser = JSON.parse(userStr);
    const telegramUserId = tgUser.id.toString();

    // L1 Canonical Identity Resolution (Nexus Collaborators)
    const [collaborator] = await db
      .select({ 
        id: nexusCollaborators.id, 
        role: nexusCollaborators.role,
        token: nexusCollaborators.token,
        status: nexusCollaborators.status
      })
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.telegramUserId, telegramUserId))
      .limit(1);

    if (!collaborator || collaborator.status === 'REJECTED' || collaborator.status === 'DISABLED') {
      return NextResponse.json({
        success: false,
        isLinked: false,
        message: "No active Nexus Collaborator profile linked to this Telegram account."
      }, { status: 403 });
    }

    if (!collaborator.token) {
       // Auto-heal: Generate a token if for some reason they don't have one
       const newToken = crypto.randomUUID();
       const extendedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
       await db.update(nexusCollaborators)
         .set({ token: newToken, expiresAt: extendedExpiry })
         .where(eq(nexusCollaborators.id, collaborator.id));
       collaborator.token = newToken;
    } else {
       // Slide expiration
       const extendedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
       await db.update(nexusCollaborators)
         .set({ expiresAt: extendedExpiry })
         .where(eq(nexusCollaborators.id, collaborator.id))
         .catch(() => null);
    }

    // Set secure HttpOnly cookie so TMA does not store secrets in localStorage
    // Using pandoras_nexus_token unifies this with Nexus Web (getNexusAuthContext)
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";
    
    cookieStore.set("pandoras_nexus_token", collaborator.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 // 30 days to match nexus token
    });

    return NextResponse.json({
      success: true,
      user: {
        id: collaborator.id,
        role: collaborator.role || 'COLLABORATOR'
      }
    });

  } catch (error: any) {
    console.error("❌ [Nexus TMA] Auth Failure:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
