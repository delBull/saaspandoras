'use server';

import { revalidatePath } from 'next/cache';
import { DashApi } from '@/lib/dash-api';

export async function toggleJourneyState(organizationSlug: string, journeyId: string, activate: boolean) {
  await DashApi.journeys.toggleStatus(journeyId, activate);
  revalidatePath(`/portal/${organizationSlug}/journeys`);
  return { success: true };
}

export async function createJourney(
  organizationSlug: string, 
  data: { name: string; description?: string; milestones: string[] }
) {
  const result = await DashApi.journeys.create(data);
  revalidatePath(`/portal/${organizationSlug}/journeys`);
  return { success: true, journeyId: result.journeyId };
}

export async function updateJourney(
  organizationSlug: string,
  journeyId: string,
  data: { name: string; description?: string; milestones: string[] }
) {
  await DashApi.journeys.update(journeyId, data);
  revalidatePath(`/portal/${organizationSlug}/journeys`);
  return { success: true };
}

export async function deleteJourney(organizationSlug: string, journeyId: string) {
  await DashApi.journeys.delete(journeyId);
  revalidatePath(`/portal/${organizationSlug}/journeys`);
  return { success: true };
}
