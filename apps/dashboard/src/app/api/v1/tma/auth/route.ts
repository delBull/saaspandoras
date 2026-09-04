import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { telegramBindings, users, sessions, securityEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { reconstructPEM } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Validates Telegram initData according to TMA security guidelines.
 */
function validateTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const searchParams = new URLSearchParams(initData);
    const hash = searchParams.get('hash');
    if (!hash) return false;

    searchParams.delete('hash');
    
    // Sort keys alphabetically
    const keys = Array.from(searchParams.keys()).sort();
    
    // Construct data-check-string
    const dataCheckString = keys.map(key => `${key}=${searchParams.get(key)}`).join('\n');
    
    // Generate Secret Key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Generate Hash
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return computedHash === hash;
  } catch (err) {
    console.error("❌ [TMA Auth] Validation error:", err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: "Missing initData" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN_HQ || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("❌ [TMA Auth] Missing TELEGRAM_BOT_TOKEN_HQ");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isValid = validateTelegramInitData(initData, botToken);
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid Telegram signature" }, { status: 401 });
    }

    // Extract user data from initData
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) {
      return NextResponse.json({ error: "Missing user in initData" }, { status: 400 });
    }

    const tgUser = JSON.parse(userStr);
    const telegramUserId = tgUser.id.toString();

    console.log(`🔍 [TMA Auth] Authenticating Telegram User: ${telegramUserId}`);

    // F10.1: Check Canonical Binding
    const bindingResult = await db
      .select({ walletAddress: telegramBindings.walletAddress })
      .from(telegramBindings)
      .where(eq(telegramBindings.telegramUserId, telegramUserId))
      .limit(1);

    const binding = bindingResult[0];

    // If NO binding exists, we DO NOT create a wallet or user.
    // We instruct the frontend to initiate the Linking/Onboarding flow.
    if (!binding || !binding.walletAddress) {
      console.log(`⚠️ [TMA Auth] No binding found for Telegram User: ${telegramUserId}`);
      return NextResponse.json({
        success: true,
        isLinked: false,
        telegramUserId,
        message: "No Pandora's Key / User found for this Telegram account. Please link your wallet or create a new one."
      });
    }

    const walletAddress = binding.walletAddress.toLowerCase();

    // Fetch Canonical User
    const userResult = await db
      .select({ id: users.id, hasPandorasKey: users.hasPandorasKey })
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    const canonicalUser = userResult[0];

    if (!canonicalUser) {
      // Edge case: Binding exists but user was deleted.
      return NextResponse.json({
        success: true,
        isLinked: false,
        telegramUserId,
        message: "Linked account no longer exists. Please re-link."
      });
    }

    // Provision Session (Identical logic to Web SIWE)
    const sid = crypto.randomUUID();
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const now = new Date();

    // Persistence
    await db.insert(sessions).values({
        id: sid,
        userId: canonicalUser.id,
        scope: 'tma',
        ip,
        userAgent,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    await db.insert(securityEvents).values({
        userId: canonicalUser.id,
        type: 'LOGIN_TMA',
        ip,
        userAgent,
        metadata: { scope: 'tma', sid, telegramUserId }
    });

    // Sign JWT
    const privateKeyRaw = process.env.JWT_PRIVATE_KEY;
    const secret = privateKeyRaw || process.env.JWT_SECRET;
    
    if (!secret) {
        throw new Error("SERVER_CONFIG_ERROR");
    }

    let token = "";
    if (privateKeyRaw && privateKeyRaw.length > 100) {
      try {
          const pem = reconstructPEM(privateKeyRaw, 'PRIVATE');
          if (pem.includes('-----BEGIN ')) {
              token = jwt.sign({
                  sub: canonicalUser.id,
                  sid: sid,
                  address: walletAddress,
                  scope: 'tma',
                  hasAccess: canonicalUser.hasPandorasKey,
                  iat: Math.floor(Date.now() / 1000),
              }, pem, { algorithm: 'RS256', expiresIn: '24h' });
          }
      } catch (e) {
          console.warn("⚠️ [TMA Auth] RS256 Failed, falling back to HS256");
      }
    }

    if (!token && process.env.JWT_SECRET) {
      token = jwt.sign({
          sub: canonicalUser.id,
          sid: sid,
          address: walletAddress,
          scope: 'tma',
          hasAccess: canonicalUser.hasPandorasKey,
          iat: Math.floor(Date.now() / 1000),
      }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '24h' });
    }

    if (!token) throw new Error("JWT_GENERATION_FAILED");

    const isProd = process.env.NODE_ENV === "production";
    const isPreview = process.env.VERCEL_ENV === "preview";
    const cookieDomain = (isProd && !isPreview) ? ".pandoras.finance" : undefined;

    const cookieStore = await cookies();
    const baseOptions = {
        httpOnly: true,
        secure: isProd, 
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 60 * 24 
    };

    await cookieStore.set("__pbox_sid", token, baseOptions);
    await cookieStore.set("auth_token", token, baseOptions);
    await cookieStore.set("pbox_session_v3", token, baseOptions);

    console.log(`✅ [TMA Auth] Session ${sid} created for Telegram User ${telegramUserId} (Canonical User: ${canonicalUser.id})`);

    return NextResponse.json({
      success: true,
      isLinked: true,
      hasAccess: canonicalUser.hasPandorasKey,
      user: {
        id: canonicalUser.id,
        address: walletAddress,
        hasAccess: canonicalUser.hasPandorasKey,
        telegramUserId
      }
    });

  } catch (error: any) {
    console.error("❌ [TMA Auth] Failure:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
