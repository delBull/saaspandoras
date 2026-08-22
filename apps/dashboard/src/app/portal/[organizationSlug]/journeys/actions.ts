'use server';

import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { hermesJourneys } from '@/db/schema';
import { and, eq, or } from 'drizzle-orm';

export async function toggleJourneyState(organizationSlug: string, journeyId: string, activate: boolean) {
  // 1. Validate authorization and resolve tenant boundary
  const { tenant } = await resolvePortalContext(organizationSlug);
  
  // 2. Perform isolated update in DB (dual-read tenant match: UUID or slug)
  await db
    .update(hermesJourneys)
    .set({
      status: activate ? 'ACTIVE' : 'INACTIVE',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(hermesJourneys.id, journeyId),
        or(
          eq(hermesJourneys.organizationId, tenant.organizationId),
          eq(hermesJourneys.organizationId, tenant.organizationSlug)
        )
      )
    );
  
  // 3. Revalidate the path so the UI refreshes
  revalidatePath(`/portal/${organizationSlug}/journeys`);
}
