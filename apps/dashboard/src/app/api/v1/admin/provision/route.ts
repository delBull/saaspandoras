import { NextResponse } from 'next/server';
import { PlatformProvisioningEngine } from '@/lib/provisioning/provisioning-engine';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';

async function handler(req: Request) {
  try {
    const adminKey = req.headers.get('x-admin-key');
    const secretAdminKey = process.env.PANDORAS_ADMIN_SECRET || process.env.PANDORAS_SECRET_KEY;

    if (secretAdminKey && adminKey !== secretAdminKey) {
      return NextResponse.json({ error: "Unauthorized Provisioning Request" }, { status: 401 });
    }

    const body = await req.json();
    const { tenantSlug, companyName, contactEmail, tier = 'PROFESSIONAL', customCapabilities, isPublicMarketplace } = body;

    if (!tenantSlug || !companyName || !contactEmail) {
      return NextResponse.json({ error: "Missing required fields: tenantSlug, companyName, contactEmail" }, { status: 400 });
    }

    const result = await PlatformProvisioningEngine.provisionTenant({
      tenantSlug,
      companyName,
      contactEmail,
      tier,
      customCapabilities,
      isPublicMarketplace
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Provisioning API] Error provisioning tenant:", error);
    return NextResponse.json({ error: error?.message || "Provisioning Failed" }, { status: 500 });
  }
}

export const POST = withSecurity(handler as any, { rateLimit: apiRateLimiter });
