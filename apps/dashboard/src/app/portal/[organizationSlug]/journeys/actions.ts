'use server';

import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { revalidatePath } from 'next/cache';

export async function toggleJourneyState(organizationSlug: string, journeyId: string, activate: boolean) {
  // Validate authorization
  await resolvePortalContext(organizationSlug);
  
  // Here we would normally update the DB: 
  // UPDATE hermes_journeys SET status = activate ? 'ACTIVE' : 'PAUSED' WHERE id = journeyId
  
  // For now, revalidate the path so the UI refreshes
  revalidatePath(`/portal/${organizationSlug}/journeys`);
}
