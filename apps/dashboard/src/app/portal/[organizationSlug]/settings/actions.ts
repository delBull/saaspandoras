'use server';

import { revalidatePath } from 'next/cache';
import { DashApi } from '@/lib/dash-api';

export interface TenantSettingsFormData {
  title?: string;
  tagline?: string;
  description?: string;
  website?: string;
  whatsappPhone?: string;
  telegramUrl?: string;
  language?: string;
  tonePreset?: string;
  humanHandoffContact?: string;
  maxResponseTokens?: number;
}

export async function updateTenantSettingsAction(
  organizationSlug: string,
  data: TenantSettingsFormData
) {
  await DashApi.settings.update(data);
  revalidatePath(`/portal/${organizationSlug}/settings`);
  revalidatePath(`/portal/${organizationSlug}`);
  return { success: true };
}

export async function generateApiKeyAction(
  organizationSlug: string,
  name: string,
  permissions: string[] = ['hermes.chat', 'knowledge.read']
) {
  const result = await DashApi.settings.createApiKey(name, permissions);
  revalidatePath(`/portal/${organizationSlug}/settings`);
  return {
    success: true,
    apiKey: result.apiKey,
    key: result.key,
  };
}

export async function revokeApiKeyAction(organizationSlug: string, keyId: string) {
  await DashApi.settings.revokeApiKey(keyId);
  revalidatePath(`/portal/${organizationSlug}/settings`);
  return { success: true };
}
