import { NextRequest, NextResponse } from "next/server";
import { LinkIntentService } from "@/lib/identity/link-intent-token";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { TenantAuthorityService } from "@/lib/pandoras/core/domains/hermes/tenants/tenant-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
});

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * POST /api/v1/portal/concierge/intent
 * Generates an ephemeral cryptographic token for the Telegram Concierge Signed Link Intent (F4).
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey) {
      const authClient = await IntegrationKeyService.validateKey(apiKey);
      if (!authClient) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: corsHeaders });
      }
    }

    const body = await req.json().catch(() => ({}));
    const { wallet, tenant } = body;

    if (!wallet || !tenant || typeof wallet !== "string" || !wallet.startsWith("0x")) {
      return NextResponse.json(
        { error: "Invalid payload: requires wallet (0x hex) and tenant slug" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify tenant exists
    const canonicalTenant = await TenantAuthorityService.resolveCanonicalTenant(tenant);
    if (!canonicalTenant) {
      return NextResponse.json(
        { error: `Unknown tenant '${tenant}'` },
        { status: 404, headers: corsHeaders }
      );
    }

    const botHandle = tenant.toLowerCase() === "snarai" ? "snaraiassit_bot" : "PandorasGrowthBot";
    const { token, expiresAt } = LinkIntentService.generateToken({
      wallet,
      tenant: canonicalTenant.canonicalOrgId,
      ttlSeconds: 900, // 15 minutes
    });

    const deepLink = `https://t.me/${botHandle}?start=link_${token}`;

    return NextResponse.json(
      {
        success: true,
        deepLink,
        token,
        tenant: canonicalTenant.canonicalOrgId,
        expiresAt: expiresAt.toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[api/portal/concierge/intent] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: err?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
