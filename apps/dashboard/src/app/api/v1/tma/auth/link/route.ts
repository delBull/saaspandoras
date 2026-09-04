import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { telegramBindings } from "@/db/schema";
import { utils } from "ethers";

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
    console.error("❌ [TMA Auth Link] Validation error:", err);
    return false;
  }
}

/**
 * F10.1 Binding Rule: A Telegram binding may only be created after proof of control.
 * This endpoint requires an active Web Session (Canonical Identity) AND a valid Telegram initData.
 */
export async function POST(request: Request) {
  try {
    const { initData, message, signature, walletAddress } = await request.json();
    if (!initData || !message || !signature || !walletAddress) {
      return NextResponse.json({ error: "Missing required parameters (initData, message, signature, walletAddress)" }, { status: 400 });
    }

    // 1. Validate Telegram Payload (Proves Telegram Identity)
    const botToken = process.env.TELEGRAM_BOT_TOKEN_HQ || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isValid = validateTelegramInitData(initData, botToken);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid Telegram signature" }, { status: 401 });
    }

    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) {
      return NextResponse.json({ error: "Missing user in initData" }, { status: 400 });
    }
    const tgUser = JSON.parse(userStr);
    const telegramUserId = tgUser.id.toString();

    // 2. Validate SIWE Signature (Proves Wallet Ownership)
    try {
      const recoveredAddress = utils.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
         return NextResponse.json({ error: "Signature verification failed. Wallet mismatch." }, { status: 401 });
      }
    } catch (sigErr) {
      console.error("❌ [TMA Auth Link] Invalid signature:", sigErr);
      return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 401 });
    }

    console.log(`🔗 [TMA Auth Link] Binding Telegram ${telegramUserId} to Wallet ${walletAddress}`);

    // 3. Upsert Binding
    await db.insert(telegramBindings)
      .values({
        telegramUserId,
        walletAddress: walletAddress.toLowerCase(),
        source: 'telegram'
      })
      .onConflictDoUpdate({
        target: telegramBindings.telegramUserId,
        set: {
          walletAddress: walletAddress.toLowerCase(),
          lastSeenAt: new Date()
        }
      });

    console.log(`✅ [TMA Auth Link] Successfully bound Telegram ${telegramUserId} to Wallet ${walletAddress}`);

    return NextResponse.json({
      success: true,
      message: "Telegram account successfully linked.",
      telegramUserId,
      walletAddress
    });

  } catch (error: any) {
    console.error("❌ [TMA Auth Link] Failure:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
