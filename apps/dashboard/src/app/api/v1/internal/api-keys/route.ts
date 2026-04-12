import { db } from "@/db";
import { integrationClients, webhookEvents } from "@/db/schema";
import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// ── Helpers ────────────────────────────────────────────────────────────────────

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/** Fingerprint = first 8 chars of hash, safe to show in UI */
function fingerprint(hash: string): string {
  return hash.slice(0, 8);
}

function generateApiKey(): string {
  const env = process.env.NODE_ENV === "production" ? "live" : "test";
  return `pk_${env}_${randomBytes(24).toString("hex")}`;
}

/** Internal secret to protect this admin endpoint (for curl/S2S usage) */
async function isAdminAuthorized(req: NextRequest): Promise<boolean> {
  // Method 1: S2S via secret header (curl, Bull's Lab config, etc.)
  const xAdminSecret = req.headers.get("x-admin-secret");
  const authHeader = req.headers.get("authorization");
  const secret = process.env.PANDORA_CORE_KEY || process.env.DASHBOARD_SECRET;

  if (secret) {
    if (xAdminSecret === secret || authHeader === `Bearer ${secret}`) return true;
  }

  // Method 2: Same-origin admin dashboard — wallet verified against administrators table
  const walletAddress =
    req.headers.get("x-thirdweb-address") ||
    req.headers.get("x-wallet-address") ||
    req.headers.get("x-user-address");

  if (walletAddress) {
    try {
      const { administrators } = await import("@/db/schema");
      const adminRow = await db.query.administrators.findFirst({
        where: eq(administrators.walletAddress, walletAddress.toLowerCase()),
      });
      if (adminRow) return true;
    } catch {
      // Fallback: env-based allowlist
    }

    // Env-based fallback (comma-separated list of admin wallets)
    const adminWallets = (process.env.ADMIN_WALLETS || "").toLowerCase().split(",").filter(Boolean);
    if (adminWallets.includes(walletAddress.toLowerCase())) return true;
  }

  return false;
}


// ── POST /api/v1/internal/api-keys  →  Create a new integration client ────────

export async function POST(req: NextRequest) {
  if (!await isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      permissions = ["read:growth_os"],
      projectId,
      callbackUrl,
      environment = "staging",
    } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const rawKey = generateApiKey();
    const keyHash = hashKey(rawKey);
    const keyFingerprint = fingerprint(keyHash);

    await db.insert(integrationClients).values({
      name,
      environment,
      projectId: projectId ?? null,
      apiKeyHash: keyHash,
      keyFingerprint,
      callbackUrl: callbackUrl ?? null,
      callbackSecretHash: callbackUrl ? hashKey(`${rawKey}_webhook_secret`) : null,
      permissions,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "API key created. This is the only time the raw key will be shown.",
        api_key: rawKey,
        key_fingerprint: keyFingerprint,
        name,
        permissions,
        environment,
        callbackUrl: callbackUrl ?? null,
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("[ApiKeys] Create failed:", e);
    return NextResponse.json({ error: "Failed to create API key", detail: e.message }, { status: 500 });
  }
}

// ── GET /api/v1/internal/api-keys  →  List all clients (NO raw keys) ──────────

export async function GET(req: NextRequest) {
  if (!await isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const all = await db.query.integrationClients.findMany({
      columns: {
        id: true,
        name: true,
        environment: true,
        projectId: true,
        keyFingerprint: true,
        permissions: true,
        isActive: true,
        callbackUrl: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ clients: all });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── DELETE /api/v1/internal/api-keys  →  Revoke by fingerprint ────────────────

export async function DELETE(req: NextRequest) {
  if (!await isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fingerprint: fp } = await req.json();
    if (!fp) return NextResponse.json({ error: "fingerprint required" }, { status: 400 });

    const record = await db.query.integrationClients.findFirst({
      where: eq(integrationClients.keyFingerprint, fp),
    });

    if (!record) return NextResponse.json({ error: "Key not found" }, { status: 404 });

    await db
      .update(integrationClients)
      .set({ isActive: false, revokedAt: new Date() })
      .where(eq(integrationClients.id, record.id));

    return NextResponse.json({ success: true, message: `Key '${record.name}' revoked.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
