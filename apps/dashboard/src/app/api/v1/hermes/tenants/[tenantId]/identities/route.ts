import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingIdentities, marketingLeads, daoMembers } from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { TenantAuthorityService } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hermes/tenants/[tenantId]/identities
 *
 * Sovereign Identity Explorer for the Tenant:
 * Returns the canonical identity records associated with this tenant/project,
 * their verified omnichannel bindings (Wallet, Telegram, Email, Phone),
 * and their authoritative governance role/voting power.
 *
 * Enforces strict tenant isolation: ONLY identities linked to this project.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;

  // 1. Auth check: channel secret or authenticated portal session
  const channelSecret = req.headers.get('x-hermes-channel-secret');
  const expectedSecret = process.env.HERMES_CHANNEL_SECRET;
  const isChannelClient = Boolean(expectedSecret) && channelSecret === expectedSecret;

  if (!isChannelClient) {
    const portalCtx = await resolvePortalContext(tenantId).catch(() => null);
    if (!portalCtx) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }
  }

  try {
    // 2. Resolve Canonical Tenant Boundary
    const canonicalTenant = await TenantAuthorityService.resolveCanonicalTenant(tenantId);
    if (!canonicalTenant || !canonicalTenant.projectId) {
      return NextResponse.json({
        success: true,
        tenantId,
        summary: { totalIdentities: 0, verifiedWallets: 0, verifiedTelegrams: 0, verifiedPhones: 0 },
        identities: [],
      });
    }

    const projectId = canonicalTenant.projectId;

    // 3. Fetch leads linked to this project
    const leads = await db
      .select()
      .from(marketingLeads)
      .where(eq(marketingLeads.projectId, projectId))
      .orderBy(desc(marketingLeads.createdAt))
      .limit(100);

    // Extract unique identityIds and wallet addresses
    const identityIds = Array.from(new Set(leads.map(l => l.identityId).filter(Boolean))) as string[];

    // 4. Fetch DAO Members for this project to get authoritative roles and voting power
    const members = await db
      .select()
      .from(daoMembers)
      .where(eq(daoMembers.projectId, projectId));

    const memberMap = new Map<string, typeof members[0]>();
    for (const m of members) {
      if (m.wallet) {
        memberMap.set(m.wallet.toLowerCase(), m);
      }
    }

    // 5. Fetch Canonical Identities from marketingIdentities
    let canonicalRows: Array<typeof marketingIdentities.$inferSelect> = [];
    if (identityIds.length > 0) {
      canonicalRows = await db
        .select()
        .from(marketingIdentities)
        .where(inArray(marketingIdentities.id, identityIds));
    }

    const identityMap = new Map<string, typeof canonicalRows[0]>();
    for (const r of canonicalRows) {
      identityMap.set(r.id, r);
    }

    // 6. Assemble rich identity views
    let verifiedWallets = 0;
    let verifiedTelegrams = 0;
    let verifiedPhones = 0;

    const seenIdentities = new Set<string>();
    const identityViews: any[] = [];

    // Combine from leads
    for (const lead of leads) {
      const canonicalRecord = lead.identityId ? identityMap.get(lead.identityId) : null;
      const key = lead.identityId || lead.walletAddress || lead.email || lead.id;
      if (seenIdentities.has(key)) continue;
      seenIdentities.add(key);

      const meta = (canonicalRecord?.metadata as any) || {};
      const verification = meta.verification || {};

      const wallet = canonicalRecord?.walletAddress || lead.walletAddress || null;
      const telegramId = canonicalRecord?.telegramId || null;
      const email = canonicalRecord?.email || lead.email || null;
      const phone = canonicalRecord?.phone || lead.phoneNumber || null;

      const isWalletVerified = verification.wallet?.status === 'VERIFIED' || Boolean(wallet);
      const isTelegramVerified = verification.telegram?.status === 'VERIFIED';
      const isPhoneVerified = verification.phone?.status === 'VERIFIED';

      if (isWalletVerified) verifiedWallets++;
      if (isTelegramVerified) verifiedTelegrams++;
      if (isPhoneVerified) verifiedPhones++;

      const memberInfo = wallet ? memberMap.get(wallet.toLowerCase()) : null;
      const metaName = (canonicalRecord?.metadata as any)?.name;

      identityViews.push({
        id: lead.identityId || lead.id,
        name: lead.name || metaName || 'Actor Soberano',
        leadType: lead.leadType || 'user_prospect',
        leadStatus: lead.status,
        identifiers: {
          wallet,
          telegramId,
          email,
          phone,
        },
        verification: {
          wallet: isWalletVerified ? (verification.wallet?.method || 'EIP-712') : 'NONE',
          telegram: isTelegramVerified ? (verification.telegram?.method || 'AUTH_HASH') : 'NONE',
          phone: isPhoneVerified ? (verification.phone?.method || 'OTP') : 'NONE',
          email: verification.email?.status || (email ? 'CAPTURED' : 'NONE'),
        },
        governance: {
          isMember: Boolean(memberInfo),
          role: memberInfo ? 'INVESTOR' : (wallet ? 'INVESTOR' : 'LEAD'),
          votingPower: Number(memberInfo?.votingPower) || 0,
          tokensOwned: Number(memberInfo?.votingPower) || 0,
        },
        createdAt: lead.createdAt,
      });
    }

    return NextResponse.json({
      success: true,
      tenantId,
      projectTitle: canonicalTenant.title,
      summary: {
        totalIdentities: identityViews.length,
        verifiedWallets,
        verifiedTelegrams,
        verifiedPhones,
      },
      identities: identityViews,
    });
  } catch (error: any) {
    console.error('[Hermes Tenant Identities API] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch tenant identities' },
      { status: 500 },
    );
  }
}
