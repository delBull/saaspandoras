import jwt from "jsonwebtoken";
import crypto from "crypto";
import { DEAL_TOKEN_SECRET, ADMIN_UNLOCK_SECRET, UNLOCK_TTL_MS, DEAL_TOKEN_EXPIRY } from "./types";

export interface DealTokenPayload {
  sub: string; // publicId
  type: "deal_access";
  email: string;
  roomId: string; // internal uuid
  iat: number;
}

/**
 * JWT single-use magic link para firmar/aceptar un deal.
 * Mismo patrón que lib/platform/portal-auth.ts (secret con fallbacks).
 */
export function generateDealToken(roomId: string, publicId: string, email: string): string {
  const payload: Omit<DealTokenPayload, "iat"> = {
    sub: publicId,
    type: "deal_access",
    email,
    roomId,
  };
  return jwt.sign(payload, DEAL_TOKEN_SECRET!, { expiresIn: DEAL_TOKEN_EXPIRY });
}

export function verifyDealToken(token: string): DealTokenPayload | null {
  // FAIL-CLOSED: verify with the canonical deal secret only. No legacy alias
  // fallbacks (PORTAL_JWT_SECRET/NEXTAUTH_SECRET) — rotating NEXUS_DEAL_TOKEN_SECRET
  // must revoke every previously issued deal token.
  if (!DEAL_TOKEN_SECRET) return null;
  try {
    const payload = jwt.verify(token, DEAL_TOKEN_SECRET) as DealTokenPayload;
    if (payload && payload.type === "deal_access") return payload;
    return null;
  } catch {
    return null;
  }
}

/**
 * HMAC token de desbloqueo del Deal Room admin (patrón BooksAccessGate).
 * Se envía al canal privado de Discord como embed con link único (2h).
 */
async function hmacSign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ADMIN_UNLOCK_SECRET);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function generateUnlockToken(email: string): Promise<string> {
  const exp = Date.now() + UNLOCK_TTL_MS;
  const sig = await hmacSign(`${email}:nexus-deal-rooms:${exp}`);
  const raw = JSON.stringify({ email, scope: "nexus-deal-rooms", exp, sig });
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function verifyUnlockToken(token: string): Promise<boolean> {
  try {
    const raw = Buffer.from(token.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    const parsed = JSON.parse(raw) as { email: string; scope: string; exp: number; sig: string };
    if (parsed.scope !== "nexus-deal-rooms") return false;
    if (Date.now() > parsed.exp) return false;
    const expected = await hmacSign(`${parsed.email}:nexus-deal-rooms:${parsed.exp}`);
    if (expected !== parsed.sig) return false;
    return true;
  } catch {
    return false;
  }
}
