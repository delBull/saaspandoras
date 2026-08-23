'use server';

import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { isValidDiscordWebhookUrl } from '@/lib/hermes/human-handoff';

const isUuid = (val?: string): boolean => 
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

function buildProjectMatchCondition(targetSlug: string, orgId?: string) {
  return or(
    eq(projects.slug, targetSlug),
    ...(isUuid(orgId) ? [eq(projects.organizationId, orgId!)] : []),
    ...(isUuid(targetSlug) ? [eq(projects.organizationId, targetSlug)] : []),
    ...(orgId && !isUuid(orgId) ? [eq(projects.slug, orgId)] : []),
    eq(projects.slug, 'snarai')
  );
}

export interface MaskedChannelsConfig {
  telegramConfigured: boolean;
  telegramBotTokenMasked?: string;
  whatsappConfigured: boolean;
  whatsappTokenMasked?: string;
  whatsappPhoneId?: string;
}

export async function getChannelsConfig(organizationSlug: string): Promise<MaskedChannelsConfig> {
  const context = await resolvePortalContext(organizationSlug);
  const targetSlug = context.tenant.organizationSlug || organizationSlug;
  const orgId = context.tenant.organizationId;
  const rows = await db.select().from(projects).where(buildProjectMatchCondition(targetSlug, orgId)).limit(1);
  const project = rows[0];
  
  if (!project) throw new Error('Project not found');
  
  const config = (project.tenantRuntimeConfig as any) || {};
  const secrets = config.secrets || {};

  return {
    telegramConfigured: Boolean(secrets.telegramBotToken),
    telegramBotTokenMasked: secrets.telegramBotToken ? '••••••••••••••••' : '',
    whatsappConfigured: Boolean(secrets.whatsappToken),
    whatsappTokenMasked: secrets.whatsappToken ? '••••••••••••••••' : '',
    whatsappPhoneId: secrets.whatsappPhoneId || '',
  };
}

export async function saveTelegramConfig(organizationSlug: string, botToken: string) {
  const context = await resolvePortalContext(organizationSlug);
  const targetSlug = context.tenant.organizationSlug || organizationSlug;
  const orgId = context.tenant.organizationId;
  const rows = await db.select().from(projects).where(buildProjectMatchCondition(targetSlug, orgId)).limit(1);
  const project = rows[0];
  if (!project) throw new Error('Project not found');

  const config = (project.tenantRuntimeConfig as any) || {};
  if (!config.secrets) config.secrets = {};
  
  // If user passed a masked token or empty string, preserve existing token
  if (botToken && botToken !== '••••••••••••••••') {
    config.secrets.telegramBotToken = botToken.trim();
  }

  await db.update(projects).set({ tenantRuntimeConfig: config }).where(eq(projects.id, project.id));
  
  revalidatePath(`/portal/${organizationSlug}/channels`);
  return { success: true };
}

export async function saveWhatsAppConfig(organizationSlug: string, token: string, phoneId: string) {
  const context = await resolvePortalContext(organizationSlug);
  const targetSlug = context.tenant.organizationSlug || organizationSlug;
  const orgId = context.tenant.organizationId;
  const rows = await db.select().from(projects).where(buildProjectMatchCondition(targetSlug, orgId)).limit(1);
  const project = rows[0];
  if (!project) throw new Error('Project not found');

  const config = (project.tenantRuntimeConfig as any) || {};
  if (!config.secrets) config.secrets = {};
  
  // If user passed a masked token or empty string, preserve existing token
  if (token && token !== '••••••••••••••••') {
    config.secrets.whatsappToken = token.trim();
  }
  if (phoneId) {
    config.secrets.whatsappPhoneId = phoneId.trim();
  }

  await db.update(projects).set({ tenantRuntimeConfig: config }).where(eq(projects.id, project.id));
  
  revalidatePath(`/portal/${organizationSlug}/channels`);
  return { success: true };
}

export interface HandoffAlertConfig {
  preferredChannel: 'email' | 'telegram' | 'whatsapp' | 'discord';
  email?: string;
  telegramChatId?: string;
  whatsappPhone?: string;
  discordWebhookUrl?: string;
}

export async function getHandoffAlertConfig(organizationSlug: string): Promise<HandoffAlertConfig> {
  const context = await resolvePortalContext(organizationSlug);
  const targetSlug = context.tenant.organizationSlug || organizationSlug;
  const orgId = context.tenant.organizationId;
  const rows = await db.select().from(projects).where(buildProjectMatchCondition(targetSlug, orgId)).limit(1);
  const project = rows[0];
  if (!project) return { preferredChannel: 'email' };

  const config = (project.tenantRuntimeConfig as any) || {};
  return config.handoffAlertConfig || { preferredChannel: 'email' };
}

export async function saveHandoffAlertConfig(organizationSlug: string, alertConfig: HandoffAlertConfig) {
  const context = await resolvePortalContext(organizationSlug);
  const targetSlug = context.tenant.organizationSlug || organizationSlug;
  const orgId = context.tenant.organizationId;

  // SSRF Protection on Discord Webhook URL
  if (alertConfig.preferredChannel === 'discord' && alertConfig.discordWebhookUrl) {
    if (!isValidDiscordWebhookUrl(alertConfig.discordWebhookUrl)) {
      throw new Error('La URL de Discord no es válida. Debe ser una URL oficial de webhook de Discord.');
    }
  }

  const rows = await db.select().from(projects).where(buildProjectMatchCondition(targetSlug, orgId)).limit(1);
  const project = rows[0];
  if (!project) throw new Error('Project not found');

  const config = (project.tenantRuntimeConfig as any) || {};
  config.handoffAlertConfig = alertConfig;

  await db.update(projects).set({ tenantRuntimeConfig: config }).where(eq(projects.id, project.id));

  revalidatePath(`/portal/${organizationSlug}/channels`);
  return { success: true };
}

export async function testTelegramConfig(organizationSlug: string, customToken?: string, targetChatId?: string) {
  let token = customToken?.trim();

  const context = await resolvePortalContext(organizationSlug);
  const targetSlug = context.tenant.organizationSlug || organizationSlug;
  const orgId = context.tenant.organizationId;
  const rows = await db.select().from(projects).where(buildProjectMatchCondition(targetSlug, orgId)).limit(1);
  const project = rows[0];

  if (!token || token.includes('••••')) {
    const config = (project?.tenantRuntimeConfig as any) || {};
    token = config.secrets?.telegramBotToken || '';
  }

  if (!token) {
    throw new Error('Token de Telegram no configurado');
  }

  const startTime = Date.now();
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      signal: AbortSignal.timeout(6000),
    });
    const latency = Date.now() - startTime;
    const data = await res.json();

    if (!data.ok || !data.result) {
      throw new Error(data.description || 'Token de Telegram inválido o revocado');
    }

    let messageSent = false;
    let messageError = '';

    // If a chat ID is provided, dispatch a personalized test message
    const finalChatId = targetChatId?.trim();
    if (finalChatId) {
      try {
        const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            chat_id: finalChatId,
            text: `🚀 <b>[Hermes OS — Test de Canal Telegram]</b>\n\n✅ <b>¡Conexión Exitosa con ${project?.title || "S'Narai"}!</b>\nEl bot <b>@${data.result.username}</b> está activo y listo para interactuar con prospectos y fundadores.\n\n⏱ Latencia: <code>${latency}ms</code>\n📅 Fecha: <code>${new Date().toLocaleString('es-MX')}</code>`,
            parse_mode: 'HTML',
          }),
        });
        const sendData = await sendRes.json();
        if (sendData.ok) {
          messageSent = true;
        } else {
          messageError = sendData.description || 'Error al enviar mensaje';
        }
      } catch (sendErr: any) {
        messageError = sendErr.message || 'Error de despacho en Telegram';
      }
    }

    return {
      success: true,
      latency,
      bot: {
        id: data.result.id,
        firstName: data.result.first_name,
        username: data.result.username,
        canJoinGroups: data.result.can_join_groups,
      },
      messageSent,
      messageError,
    };
  } catch (err: any) {
    throw new Error(err.message || 'Error de conexión con Telegram API');
  }
}

export async function testWhatsAppConfig(
  organizationSlug: string, 
  customToken?: string, 
  customPhoneId?: string,
  targetPhone?: string
) {
  let token = customToken?.trim();
  let phoneId = customPhoneId?.trim();

  const context = await resolvePortalContext(organizationSlug);
  const targetSlug = context.tenant.organizationSlug || organizationSlug;
  const orgId = context.tenant.organizationId;
  const rows = await db.select().from(projects).where(buildProjectMatchCondition(targetSlug, orgId)).limit(1);
  const project = rows[0];

  if (!token || token.includes('••••') || !phoneId) {
    const config = (project?.tenantRuntimeConfig as any) || {};
    if (!token || token.includes('••••')) token = config.secrets?.whatsappToken || '';
    if (!phoneId) phoneId = config.secrets?.whatsappPhoneId || '';
  }

  if (!token || !phoneId) {
    throw new Error('Credenciales de WhatsApp (Token o PhoneID) incompletas');
  }

  const startTime = Date.now();
  try {
    const url = `https://graph.facebook.com/v21.0/${phoneId}?fields=verified_name,code_verification_status,display_phone_number,quality_rating&access_token=${token}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
    });
    const latency = Date.now() - startTime;
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message || 'Credenciales de Meta Cloud API inválidas');
    }

    let messageSent = false;
    let messageError = '';

    // If destination phone is provided, dispatch a live test message
    const finalPhone = targetPhone?.trim().replace(/\D/g, '');
    if (finalPhone) {
      try {
        const sendRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: finalPhone,
            type: 'text',
            text: {
              preview_url: false,
              body: `⚡ *[Hermes OS — Test de Canal WhatsApp]*\n\n✅ *¡Conexión Exitosa con ${project?.title || "S'Narai"}!*\nEl número oficial *${data.display_phone_number || phoneId}* (${data.verified_name || 'WABA'}) está conectado y operativo en Meta Cloud.\n\n📊 Calidad: *${data.quality_rating || 'GREEN'}*\n⏱ Latencia: *${latency}ms*\n📅 Fecha: *${new Date().toLocaleString('es-MX')}*`
            }
          }),
        });
        const sendData = await sendRes.json();
        if (sendData.messages && sendData.messages.length > 0) {
          messageSent = true;
        } else if (sendData.error) {
          messageError = sendData.error.message || 'Error de envío en WhatsApp';
        }
      } catch (sendErr: any) {
        messageError = sendErr.message || 'Fallo de conexión al enviar WhatsApp';
      }
    }

    return {
      success: true,
      latency,
      waba: {
        phoneId,
        verifiedName: data.verified_name || 'Nombre Verificado',
        displayPhoneNumber: data.display_phone_number || phoneId,
        qualityRating: data.quality_rating || 'GREEN',
        status: data.code_verification_status || 'VERIFIED',
      },
      messageSent,
      messageError,
    };
  } catch (err: any) {
    throw new Error(err.message || 'Error de conexión con Meta Cloud API');
  }
}

export async function testHandoffAlert(organizationSlug: string, alertConfig: HandoffAlertConfig) {
  const context = await resolvePortalContext(organizationSlug);
  const targetSlug = context.tenant.organizationSlug || organizationSlug;
  const orgId = context.tenant.organizationId;
  const rows = await db.select().from(projects).where(buildProjectMatchCondition(targetSlug, orgId)).limit(1);
  const project = rows[0];
  if (!project) throw new Error('Project not found');

  const channel = alertConfig.preferredChannel || 'discord';

  if (channel === 'discord') {
    const webhookUrl = alertConfig.discordWebhookUrl;
    if (!webhookUrl || !isValidDiscordWebhookUrl(webhookUrl)) {
      throw new Error('Debes ingresar una URL de webhook de Discord válida');
    }
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        embeds: [{
          title: `🧪 [Test Hermes OS] Alerta de Escalación en ${project.title}`,
          description: 'Esta es una notificación de prueba para verificar la integración en tiempo real del canal de escalación humana.',
          color: 0x10b981,
          fields: [
            { name: 'Canal', value: 'Discord Webhook', inline: true },
            { name: 'Estado', value: '✅ Operativo y Conectado', inline: true },
            { name: 'Timestamp', value: new Date().toLocaleTimeString(), inline: true },
          ],
          footer: { text: 'Hermes Omnichannel Mesh • Pandoras Growth OS' },
        }],
      }),
    });
    if (!res.ok) throw new Error(`Fallo al enviar a Discord (${res.status})`);
  } else if (channel === 'telegram') {
    const config = (project.tenantRuntimeConfig as any) || {};
    const botToken = config.secrets?.telegramBotToken;
    const chatId = alertConfig.telegramChatId;
    if (!botToken || !chatId) {
      throw new Error('Configura el Token de Bot de Telegram y tu Chat ID de destino para probar');
    }
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        chat_id: chatId,
        text: `🧪 <b>[Test Hermes OS] Alerta de Escalación en ${project.title}</b>\n\nNotificación de prueba enviada con éxito desde el portal de Hermes.`,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || 'Fallo al enviar a Telegram');
  }

  return { success: true, message: `Alerta de prueba enviada a ${channel}` };
}
