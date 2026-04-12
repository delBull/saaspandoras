import { db } from "@/db";
import { integrationClients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";

export interface ExternalClient {
  id: string;
  name: string;
  permissions: string[];
  projectId: number | null;
  callbackUrl: string | null;
}

export interface ValidationResult {
  client: ExternalClient | null;
  error: string | null;
}

/**
 * Hashes an API key using SHA-256 for safe DB lookup.
 */
function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Extracts the API key from a request.
 * Accepts: x-api-key header, or Authorization: Bearer <key>
 */
export function extractKeyFromRequest(req: Request): string | null {
  const xApiKey = req.headers.get("x-api-key");
  if (xApiKey) return xApiKey.trim();

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * Validates an external API key and verifies it has the required permission.
 *
 * Usage:
 *   const { client, error } = await validateExternalKey(req, "read:growth_os");
 *   if (error || !client) return NextResponse.json({ error }, { status: 401 });
 */
export async function validateExternalKey(
  req: Request,
  requiredPermission: string
): Promise<ValidationResult> {
  const rawKey = extractKeyFromRequest(req);

  if (!rawKey) {
    return { client: null, error: "Missing API key. Use x-api-key header or Authorization: Bearer <key>" };
  }

  const keyHash = hashKey(rawKey);

  let record: any;
  try {
    record = await db.query.integrationClients.findFirst({
      where: and(
        eq(integrationClients.apiKeyHash, keyHash),
        eq(integrationClients.isActive, true)
      ),
    });
  } catch (e) {
    console.error("[ApiAuth] DB lookup failed:", e);
    return { client: null, error: "Internal auth error" };
  }

  if (!record) {
    return { client: null, error: "Invalid or revoked API key" };
  }

  const permissions = (record.permissions as string[]) || [];
  if (!permissions.includes(requiredPermission)) {
    return {
      client: null,
      error: `Insufficient permissions. This key does not have '${requiredPermission}'.`,
    };
  }

  // Update lastUsedAt in background (fire-and-forget, doesn't block response)
  db.update(integrationClients)
    .set({ lastUsedAt: new Date() })
    .where(eq(integrationClients.id, record.id))
    .catch(() => {}); // Silently fail — non-critical

  return {
    client: {
      id: record.id,
      name: record.name,
      permissions,
      projectId: record.projectId ?? null,
      callbackUrl: record.callbackUrl ?? null,
    },
    error: null,
  };
}
