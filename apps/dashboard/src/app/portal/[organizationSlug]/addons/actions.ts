'use server';

import { DashApi } from '@/lib/dash-api';
import { revalidatePath } from 'next/cache';

export async function toggleAddOnAction(organizationSlug: string, addonId: string, targetActive: boolean) {
  await DashApi.addons.toggle(addonId, targetActive);
  revalidatePath(`/portal/${organizationSlug}/addons`);
  return { success: true, active: targetActive };
}
