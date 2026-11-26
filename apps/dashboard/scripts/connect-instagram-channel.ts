#!/usr/bin/env bun
/**
 * Conecta la cuenta de Instagram de un tenant usando el mecanismo canónico
 * (`TenantChannelService.connectChannel` → `tenant_social_integrations`).
 *
 * No hay ids ni tokens en el código: se leen del entorno.
 *
 *   IG_TENANT_SLUG=snarai \
 *   META_IG_USER_ID=17841400000000001 \
 *   META_IG_ACCESS_TOKEN=IGAA... \
 *   META_IG_API_BASE=https://graph.instagram.com/v21.0 \
 *   bun apps/dashboard/scripts/connect-instagram-channel.ts
 *
 * Salida: DTO saneado (sin secretos). La verificación real de la cuenta se hace
 * con `verify-connect` en el mismo tenant; si el webhook no llega, el log queda
 * en `social_dm_log` con el motivo.
 */
import { db } from '@saasfly/db-core';
import { eq } from '@saasfly/db-core';
import { projects } from '@saasfly/db-core/schema';
import { tenantChannelService } from '@saasfly/hermes-core';

const DEFAULT_API_BASE = 'https://graph.instagram.com/v21.0';

async function main() {
  const slug = (process.env.IG_TENANT_SLUG || '').trim().toLowerCase();
  const igUserId = (process.env.META_IG_USER_ID || '').trim();
  const accessToken = (process.env.META_IG_ACCESS_TOKEN || '').trim();
  const apiBase = (process.env.META_IG_API_BASE || DEFAULT_API_BASE).trim();
  const handle = (process.env.IG_ACCOUNT_HANDLE || '').trim();
  const accountName = (process.env.IG_ACCOUNT_NAME || '').trim();

  const missing = [
    !slug && 'IG_TENANT_SLUG',
    !igUserId && 'META_IG_USER_ID',
    !accessToken && 'META_IG_ACCESS_TOKEN',
  ].filter(Boolean);

  if (missing.length) {
    console.error(`❌ Faltan variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const [project] = await db
    .select({ id: projects.id, title: projects.title, organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  if (!project?.organizationId) {
    console.error(`❌ No existe el tenant '${slug}' o no tiene organización canónica.`);
    process.exit(1);
  }

  const existing = await tenantChannelService.listChannels(project.organizationId);
  const already = existing.channels.find((channel: any) => channel.channel === 'instagram');
  if (already) {
    console.log(`ℹ️  El tenant ya tiene una integración de Instagram (${already.id}).`);
    console.log('   Para rotar credenciales: revoca esa integración y vuelve a correr este script.');
    console.log(JSON.stringify(already, null, 2));
    return;
  }

  /**
   * Pre-flight: el token debe ser válido **para esa cuenta**. Guardar un token
   * que no corresponde deja el canal en un estado que sólo falla cuando llega
   * un comentario real, y Meta no permite reintentar la respuesta privada.
   * Con Instagram Login, `user_id` es el id de la cuenta profesional.
   */
  const probeUrl = `${apiBase}/me?fields=user_id,username,account_type&access_token=${encodeURIComponent(accessToken)}`;
  const probeRes = await fetch(probeUrl).catch(() => null);
  const probe: any = probeRes ? await probeRes.json().catch(() => ({})) : {};

  if (!probeRes?.ok) {
    console.error('❌ Meta rechazó el token:', probe?.error?.message || `HTTP ${probeRes?.status ?? 'sin respuesta'}`);
    console.error('   Este script espera un token de Instagram Login (graph.instagram.com) con');
    console.error('   instagram_business_basic + instagram_business_manage_messages.');
    process.exit(1);
  }

  const probeId = String(probe?.user_id || probe?.id || '').trim();
  if (probeId && probeId !== igUserId) {
    console.error(`❌ El token pertenece a la cuenta ${probeId}, no a ${igUserId}.`);
    process.exit(1);
  }

  console.log(`✓ Token válido para @${probe.username || igUserId} (${probe.account_type || 'cuenta profesional'}).`);

  const dto = await tenantChannelService.connectChannel(
    project.organizationId,
    'script:connect-instagram-channel',
    {
      channel: 'instagram',
      accountName: accountName || `${project.title} · Instagram`,
      accountHandle: handle || `@${slug}`,
      credentials: { igUserId, accessToken, apiBase },
      supportedCapabilities: ['text', 'image'],
      metadata: { apiBase },
    },
  );

  console.log('✅ Instagram conectado (secretos cifrados en el vault).');
  console.log(JSON.stringify(dto, null, 2));
  console.log(`\nWebhook a suscribir en Meta: https://dash.pandoras.finance/api/v1/external/instagram/webhook`);
  console.log(`Cuenta receptora (entry[0].id): ${igUserId}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error conectando Instagram:', err?.message || err);
    process.exit(1);
  });
