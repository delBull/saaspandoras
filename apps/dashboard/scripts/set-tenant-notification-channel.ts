#!/usr/bin/env bun
/**
 * Configura el canal de avisos de un tenant (ADR-019).
 *
 *   bun run apps/dashboard/scripts/set-tenant-notification-channel.ts \
 *     --org=snarai --url=https://discord.com/api/webhooks/… --by=marco
 *
 * Sólo acepta webhooks de Discord (`https://discord.com/api/webhooks/…`) y
 * escribe en `tenant_notification_channels`. Si el tenant ya tiene canal para ese
 * `kind`, se actualiza; no se duplica.
 *
 * Nunca se usa un webhook global como respaldo: un tenant sin canal sólo recibe
 * el aviso in-app.
 */
import { db } from '@saasfly/db-core';
import { tenantNotificationChannels } from '@saasfly/db-core/schema';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const org = (arg('org') || '').trim().toLowerCase();
const url = (arg('url') || '').trim();
const kind = (arg('kind') || 'approvals').trim();
const channel = (arg('channel') || 'discord_webhook').trim();
const createdBy = arg('by') || 'operator';

if (!org) fail('Falta --org=<slug del tenant>');
if (!url) fail('Falta --url=<webhook del canal privado>');
if (!/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/i.test(url)) {
  fail('La URL no es un webhook de Discord válido (https://discord.com/api/webhooks/<id>/<token>)');
}

const [row] = await db
  .insert(tenantNotificationChannels)
  .values({
    id: `tnc_${org}_${kind}_${channel}`.slice(0, 64),
    canonicalOrgId: org,
    kind,
    channel,
    target: url,
    enabled: true,
    createdBy,
  })
  .onConflictDoUpdate({
    target: [
      tenantNotificationChannels.canonicalOrgId,
      tenantNotificationChannels.kind,
      tenantNotificationChannels.channel,
    ],
    set: { target: url, enabled: true, updatedAt: new Date(), createdBy },
  })
  .returning({ id: tenantNotificationChannels.id, org: tenantNotificationChannels.canonicalOrgId });

console.log(JSON.stringify({ ok: true, id: row?.id, organization: row?.org, kind, channel }, null, 2));
process.exit(0);
