'use server';

import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { isValidDiscordWebhookUrl } from '@/lib/hermes/human-handoff';

export interface MaskedChannelsConfig {
  telegramConfigured: boolean;
  telegramBotTokenMasked?: string;
  whatsappConfigured: boolean;
  whatsappTokenMasked?: string;
  whatsappPhoneId?: string;
}

export async function getChannelsConfig(organizationSlug: string): Promise<MaskedChannelsConfig> {
  const context = await resolvePortalContext(organizationSlug);
  const rows = await db.select().from(projects).where(eq(projects.slug, context.tenant.organizationId)).limit(1);
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
  const orgId = context.tenant.organizationId;
  const rows = await db.select().from(projects).where(eq(projects.slug, orgId)).limit(1);
  const project = rows[0];
  if (!project) throw new Error('Project not found');

  const config = (project.tenantRuntimeConfig as any) || {};
  if (!config.secrets) config.secrets = {};
  
  // If user passed a masked token or empty string, preserve existing token
  if (botToken && botToken !== '••••••••••••••••') {
    config.secrets.telegramBotToken = botToken.trim();
  }

  await db.update(projects).set({ tenantRuntimeConfig: config }).where(eq(projects.slug, orgId));
  
  revalidatePath(`/portal/${organizationSlug}/channels`);
  return { success: true };
}

export async function saveWhatsAppConfig(organizationSlug: string, token: string, phoneId: string) {
  const context = await resolvePortalContext(organizationSlug);
  const orgId = context.tenant.organizationId;
  const rows = await db.select().from(projects).where(eq(projects.slug, orgId)).limit(1);
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

  await db.update(projects).set({ tenantRuntimeConfig: config }).where(eq(projects.slug, orgId));
  
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
  const orgId = context.tenant.organizationId;
  const rows = await db.select().from(projects).where(eq(projects.slug, orgId)).limit(1);
  const project = rows[0];
  if (!project) return { preferredChannel: 'email' };

  const config = (project.tenantRuntimeConfig as any) || {};
  return config.handoffAlertConfig || { preferredChannel: 'email' };
}

export async function saveHandoffAlertConfig(organizationSlug: string, alertConfig: HandoffAlertConfig) {
  const context = await resolvePortalContext(organizationSlug);
  const orgId = context.tenant.organizationId;

  // SSRF Protection on Discord Webhook URL
  if (alertConfig.preferredChannel === 'discord' && alertConfig.discordWebhookUrl) {
    if (!isValidDiscordWebhookUrl(alertConfig.discordWebhookUrl)) {
      throw new Error('La URL de Discord no es válida. Debe ser una URL oficial de webhook de Discord.');
    }
  }

  const rows = await db.select().from(projects).where(eq(projects.slug, orgId)).limit(1);
  const project = rows[0];
  if (!project) throw new Error('Project not found');

  const config = (project.tenantRuntimeConfig as any) || {};
  config.handoffAlertConfig = alertConfig;

  await db.update(projects).set({ tenantRuntimeConfig: config }).where(eq(projects.slug, orgId));

  revalidatePath(`/portal/${organizationSlug}/channels`);
  return { success: true };
}
