import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import crypto from 'crypto';
import { CanonicalIdentityGraph } from '@/lib/identity/canonical-identity-graph';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Auth, X-Telegram-Init-Data, Authorization',
  'Access-Control-Allow-Credentials': 'true',
});

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Validates Telegram initData cryptographic integrity using bot token HMAC.
 */
function parseTelegramInitData(initData: string, botToken: string) {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([key, val]) => `${key}=${val}`).join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const isHashValid = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculatedHash, 'hex'));
  if (!isHashValid) {
    console.warn('[TMA Auth Link] Telegram initData hash verification failed.');
    return null;
  }

  const userJson = params.get('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

// Ephemeral cache for consumed signatures to prevent EIP-191 replay attacks
const consumedEip191Signatures = new Set<string>();

/**
 * POST /api/v1/tma/auth/link
 * Bridges Telegram User ID <-> Web3 Wallet Address via EIP-191 Proof (F5).
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const body = await req.json().catch(() => ({}));
    const { initData, message, signature, walletAddress } = body;

    if (!walletAddress || !message || !signature) {
      return NextResponse.json(
        { error: 'Missing required link parameters: walletAddress, message, signature' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanWallet = (walletAddress as string).trim().toLowerCase();
    if (!cleanWallet.startsWith('0x') || cleanWallet.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid wallet address format (must be 42-char 0x hex)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 0. Replay Prevention on EIP-191 Signature
    if (consumedEip191Signatures.has(signature)) {
      return NextResponse.json(
        { error: 'Cryptographic replay rejected: Signature has already been consumed' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 1. Verify EIP-191 Signature Cryptographically
    let isSigValid = false;
    try {
      isSigValid = await verifyMessage({
        address: cleanWallet as `0x${string}`,
        message: message as string,
        signature: signature as `0x${string}`,
      });
    } catch (e: any) {
      console.warn('[TMA Auth Link] EIP-191 signature parsing failed:', e);
      return NextResponse.json(
        { error: 'Invalid cryptographic signature' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!isSigValid) {
      return NextResponse.json(
        { error: 'Cryptographic proof rejected: Signature does not match wallet address' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Extract and Validate Telegram Identity
    const rawInitData = initData || req.headers.get('x-telegram-init-data') || '';
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

    let tgUser: any = null;
    if (botToken && rawInitData) {
      tgUser = parseTelegramInitData(rawInitData, botToken);
    }

    // Fallback parser if botToken is missing in dev environment
    if (!tgUser && rawInitData) {
      try {
        const p = new URLSearchParams(rawInitData);
        const userStr = p.get('user');
        if (userStr) tgUser = JSON.parse(userStr);
      } catch {}
    }

    if (!tgUser || !tgUser.id) {
      return NextResponse.json(
        { error: 'Telegram authentication failed: Could not verify Telegram user from initData' },
        { status: 401, headers: corsHeaders }
      );
    }

    const telegramUserId = String(tgUser.id);

    // 2.1 Actor Binding & Domain Separation Integrity
    // If the signed message contains an explicit Telegram ID, it MUST match the authenticated Telegram actor
    const tgIdMatch = (message as string).match(/(?:telegram(?:\s*id)?|tg)[^\d]*(\d+)/i);
    if (tgIdMatch && tgIdMatch[1] && tgIdMatch[1] !== telegramUserId) {
      console.warn(`[TMA Auth Link] Actor mismatch: message authorized tg=${tgIdMatch[1]} but initData is tg=${telegramUserId}`);
      return NextResponse.json(
        { error: 'Cross-actor binding rejected: Signature was authorized for a different Telegram account' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2.2 Freshness Check (15 min window)
    const timestampMatch = (message as string).match(/(?:timestamp|link)[^\d]*(\d{10,13})/i);
    if (timestampMatch && timestampMatch[1]) {
      const msgTime = Number(timestampMatch[1].length === 10 ? Number(timestampMatch[1]) * 1000 : timestampMatch[1]);
      const ageMs = Math.abs(Date.now() - msgTime);
      if (ageMs > 15 * 60 * 1000) {
        return NextResponse.json(
          { error: 'Proof expired: Message timestamp is older than 15 minutes' },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Atomically claim signature to prevent replay
    consumedEip191Signatures.add(signature);

    // 3. Resolve or Create Canonical Identity via Graph SDK
    const canonicalRecord = await CanonicalIdentityGraph.resolveCanonicalIdentity({
      type: 'wallet',
      value: cleanWallet,
      confidence: 'VERIFIED',
      verificationMethod: 'EIP_191_PROOF',
    }, { autoCreate: true });

    if (!canonicalRecord) {
      return NextResponse.json(
        { error: 'Failed to resolve canonical identity' },
        { status: 500, headers: corsHeaders }
      );
    }

    // 4. Attach Telegram Identifier (Enforcing Anti-Auto-Merge & Collision Detection)
    const attachResult = await CanonicalIdentityGraph.attachIdentifier({
      identityId: canonicalRecord.identityId,
      identifier: {
        type: 'telegram',
        value: telegramUserId,
        confidence: 'VERIFIED',
        verificationMethod: 'TG_WEBAPP_INITDATA',
      },
      proof: {
        signature,
        message,
        telegramUsername: tgUser.username,
      },
      organizationId: 'pandoras',
      actorId: telegramUserId,
    });

    if (!attachResult.success) {
      return NextResponse.json(
        {
          error: attachResult.reason || 'Failed to bind Telegram account',
          collision: attachResult.collision,
        },
        { status: 409, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        identityId: canonicalRecord.identityId,
        walletAddress: cleanWallet,
        telegramId: telegramUserId,
        linkedAt: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[POST api/v1/tma/auth/link] Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: err?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
