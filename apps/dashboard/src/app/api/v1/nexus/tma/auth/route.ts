import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@saasfly/db-core";
import { telegramBindings, users } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { cookies } from "next/headers";
import { ActorIdentityBindingService, ActorBindingProof } from "@saasfly/hermes-core";

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

    // L1 Canonical Identity Resolution
    const bindingResult = await db
      .select({ walletAddress: telegramBindings.walletAddress })
      .from(telegramBindings)
      .where(eq(telegramBindings.telegramUserId, telegramUserId))
      .limit(1);

    const binding = bindingResult[0];

    if (!binding || !binding.walletAddress) {
      return NextResponse.json({
        success: false,
        isLinked: false,
        message: "No canonical identity linked. Please link your wallet first in Nexus."
      }, { status: 403 });
    }

    const walletAddress = binding.walletAddress.toLowerCase();

    const userResult = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    const canonicalUser = userResult[0];

    if (!canonicalUser) {
      return NextResponse.json({
        success: false,
        isLinked: false,
        message: "Linked account no longer exists."
      }, { status: 403 });
    }

    // Server-authoritative resolution for Nexus TMA
    // For now we lock it to pandoras tenant.
    const canonicalOrgId = "pandoras"; 

    // Create a cryptographic bound session
    const proof: ActorBindingProof = {
      actorId: canonicalUser.id,
      tenantId: canonicalOrgId,
      authProvider: 'TELEGRAM_INIT_DATA',
      proofSignature: 'verified_via_hmac',
      issuedAt: Math.floor(Date.now() / 1000),
      nonce: crypto.randomUUID()
    };

    // Short-lived session (2 hours)
    const boundSession = ActorIdentityBindingService.createBoundSession(proof, 'CONFIDENTIAL', 7200);

    // Set secure HttpOnly cookie so TMA does not store secrets in localStorage
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";
    
    cookieStore.set("nexus_tma_session", JSON.stringify(boundSession), {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7200
    });

    return NextResponse.json({
      success: true,
      user: {
        id: canonicalUser.id,
        role: canonicalUser.role
      }
    });

  } catch (error: any) {
    console.error("❌ [Nexus TMA] Auth Failure:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
