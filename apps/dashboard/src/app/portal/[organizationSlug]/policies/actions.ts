'use server';

import { DashApi } from '@/lib/dash-api';
import { revalidatePath } from 'next/cache';

export async function savePolicy(organizationSlug: string, key: string, content: string) {
  try {
    await DashApi.policies.save(key, content);
    revalidatePath(`/portal/${organizationSlug}/policies`);
  } catch (error) {
    console.error("Failed to save policy via DashApi", error);
    throw new Error("Failed to save policy to knowledge base");
  }
}
