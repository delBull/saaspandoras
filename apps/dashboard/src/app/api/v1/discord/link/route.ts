import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { utils } from 'ethers';
import { db } from '@saasfly/db';
import { channelIdentityBindings } from '@saasfly/db/schema';
import { and, eq } from '@saasfly/db-core';
import { verifyLinkToken } from '@/lib/discord/oauth';
import { buildLinkMessage } from '@/lib/discord/link-message';
import { getDiscordBotConfig, isDiscordBotConfigured } from '@/lib/discord/config';
import { resolveMembershipForWallet } from '@/lib/discord/membership-db';
import { syncMemberRoles } from '@/lib/discord/roles';
import { rolesForMembership, allManagedRoles } from '@/lib/discord/membership';
import { resolveDiscordTenant } from '@/lib/discord/tenants';
import { upsertDiscordLead } from '@/lib/growth/discord-lead';
import { SecurityAuditLogger } from '@saasfly/hermes-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `POST /api/v1/discord/link`
 *
 * Cierra el vínculo: token firmado (emitido por el callback de OAuth) + firma de
 * la wallet sobre un mensaje que contiene ese token (anti-replay). Sólo entonces
 * se guarda la relación y se sincronizan los roles del servidor.
 *
 * Body: { token, walletAddress, signature, message }
 */
export async function POST(req: Request) {
  if (!isDiscordBotConfigured()) {
    return NextResponse.json({ success: false, error: 'DISCORD_NOT_CONFIGURED' }, { status: 503 });
  }

  let body: {
    token?: string;
    walletAddress?: string;
    signature?: string;
    message?: string;
    tenant?: string;
    discordUsername?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const token = String(body.token || '');
  const walletAddress = String(body.walletAddress || '').toLowerCase();
  const signature = String(body.signature || '');
  const message = String(body.message || '');

  if (!token || !walletAddress || !signature || !message) {
    return NextResponse.json({ success: false, error: 'MISSING_PARAMETERS' }, { status: 400 });
  }
  if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json({ success: false, error: 'INVALID_WALLET' }, { status: 400 });
  }

  const link = verifyLinkToken(token);
  if (!link) {
    return NextResponse.json({ success: false, error: 'LINK_TOKEN_INVALID_OR_EXPIRED' }, { status: 401 });
  }

  // El mensaje debe ser exactamente el esperado para este token y este Discord.
  if (message !== buildLinkMessage(link.discordUserId, token)) {
    return NextResponse.json({ success: false, error: 'MESSAGE_MISMATCH' }, { status: 400 });
  }

  let recovered: string;
  try {
    recovered = utils.verifyMessage(message, signature).toLowerCase();
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_SIGNATURE' }, { status: 400 });
  }
  if (recovered !== walletAddress) {
    return NextResponse.json({ success: false, error: 'SIGNATURE_WALLET_MISMATCH' }, { status: 403 });
  }

  const membership = await resolveMembershipForWallet(walletAddress, body.tenant);
  const cfg = getDiscordBotConfig();
  const desiredRoles = rolesForMembership(membership, cfg.roles);
  const managedRoles = allManagedRoles(cfg.roles);

  // Vínculo: un Discord ↔ una wallet. Si existía con otra wallet, se reemplaza
  // (el usuario probó posesión de la nueva con su firma).
  const [existing] = await db
    .select({ id: channelIdentityBindings.id })
    .from(channelIdentityBindings)
    .where(and(
      eq(channelIdentityBindings.channel, 'discord'),
      eq(channelIdentityBindings.externalUserId, link.discordUserId),
    ))
    .limit(1);

  if (existing) {
    await db
      .update(channelIdentityBindings)
      .set({ address: walletAddress, identityId: walletAddress, status: 'ACTIVE', verifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(channelIdentityBindings.id, existing.id));
  } else {
    await db.insert(channelIdentityBindings).values({
      id: crypto.randomUUID(),
      identityId: walletAddress,
      channel: 'discord',
      externalUserId: link.discordUserId,
      address: walletAddress,
      status: 'ACTIVE',
      verifiedAt: new Date(),
    });
  }

  const sync = await syncMemberRoles({
    discordUserId: link.discordUserId,
    desiredRoles,
    managedRoles,
  });

  // Growth OS: la verificación se convierte en lead (o actualiza el existente).
  // Sin esto, el canal captaba gente que nunca aparecía en el embudo.
  let leadResult: { leadId: string | null; created: boolean } = { leadId: null, created: false };
  try {
    const tenant = resolveDiscordTenant(body.tenant);
    const projectId = tenant.projectId;
    if (projectId) {
      leadResult = await upsertDiscordLead({
        projectId,
        tenantId: tenant.slug,
        discordUserId: link.discordUserId,
        discordUsername: body.discordUsername ?? null,
        wallet: walletAddress,
        phone: null,
        membership: {
          isParticipant: membership.isParticipant,
          tier: membership.tier,
          certificates: membership.certificates,
        },
      });
    }
  } catch (err: any) {
    console.warn('[Discord link] lead upsert failed:', err?.message || err);
  }

  await SecurityAuditLogger.logEvent({
    organizationId: 'snarai',
    actorId: `discord:${link.discordUserId}`,
    eventType: 'IDENTITY_LINK_VERIFIED',
    severity: 'INFO',
    policyDecision: 'ALLOW',
    correlationId: `discord_link_${link.discordUserId}_${Date.now()}`,
    metadata: {
      wallet: `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`,
      channel: 'discord',
      isParticipant: membership.isParticipant,
      tier: membership.tier,
      certificates: membership.certificates,
      rolesAdded: sync.added.length,
      rolesRemoved: sync.removed.length,
      roleErrors: sync.errors.length,
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    discordUserId: link.discordUserId,
    wallet: walletAddress,
    membership: {
      isParticipant: membership.isParticipant,
      tier: membership.tier,
      certificates: membership.certificates,
      mintedCertificates: membership.mintedCertificates,
      paidOrders: membership.paidOrders,
      reason: membership.reason,
    },
    roles: {
      desired: desiredRoles,
      added: sync.added,
      removed: sync.removed,
      errors: sync.errors,
    },
    lead: { id: leadResult.leadId, created: leadResult.created },
  });
}
