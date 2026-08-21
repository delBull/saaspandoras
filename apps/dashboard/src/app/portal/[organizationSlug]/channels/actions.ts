'use server';

import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export async function getChannelsConfig(organizationSlug: string) {
  const context = await resolvePortalContext(organizationSlug);
  const rows = await db.select().from(projects).where(eq(projects.slug, context.tenant.organizationId)).limit(1);
  const project = rows[0];
  
  if (!project) throw new Error('Project not found');
  
  const config = (project.tenantRuntimeConfig as any) || {};
  return config.secrets || {};
}

export async function saveTelegramConfig(organizationSlug: string, botToken: string) {
  const context = await resolvePortalContext(organizationSlug);
  const rows = await db.select().from(projects).where(eq(projects.slug, context.tenant.organizationId)).limit(1);
  const project = rows[0];
  if (!project) throw new Error('Project not found');

  const config = (project.tenantRuntimeConfig as any) || {};
  if (!config.secrets) config.secrets = {};
  
  config.secrets.telegramBotToken = botToken;

  await db.update(projects).set({ tenantRuntimeConfig: config }).where(eq(projects.slug, organizationSlug));
  
  revalidatePath(`/portal/${organizationSlug}/channels`);
  return { success: true };
}

export async function saveWhatsAppConfig(organizationSlug: string, token: string, phoneId: string) {
  const context = await resolvePortalContext(organizationSlug);
  const rows = await db.select().from(projects).where(eq(projects.slug, context.tenant.organizationId)).limit(1);
  const project = rows[0];
  if (!project) throw new Error('Project not found');

  const config = (project.tenantRuntimeConfig as any) || {};
  if (!config.secrets) config.secrets = {};
  
  config.secrets.whatsappToken = token;
  config.secrets.whatsappPhoneId = phoneId;

  await db.update(projects).set({ tenantRuntimeConfig: config }).where(eq(projects.slug, organizationSlug));
  
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
  const rows = await db.select().from(projects).where(eq(projects.slug, context.tenant.organizationId)).limit(1);
  const project = rows[0];
  if (!project) return { preferredChannel: 'email' };

  const config = (project.tenantRuntimeConfig as any) || {};
  return config.handoffAlertConfig || { preferredChannel: 'email' };
}

export async function saveHandoffAlertConfig(organizationSlug: string, alertConfig: HandoffAlertConfig) {
  const context = await resolvePortalContext(organizationSlug);
  const rows = await db.select().from(projects).where(eq(projects.slug, context.tenant.organizationId)).limit(1);
  const project = rows[0];
  if (!project) throw new Error('Project not found');

  const config = (project.tenantRuntimeConfig as any) || {};
  config.handoffAlertConfig = alertConfig;

  await db.update(projects).set({ tenantRuntimeConfig: config }).where(eq(projects.slug, organizationSlug));

  revalidatePath(`/portal/${organizationSlug}/channels`);
  return { success: true };
}
