'use server';

import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { hermesJourneys, hermesJourneyStages, projects } from '@/db/schema';
import { and, eq, or } from 'drizzle-orm';
import crypto from 'crypto';

export async function toggleJourneyState(organizationSlug: string, journeyId: string, activate: boolean) {
  const { tenant } = await resolvePortalContext(organizationSlug);
  const targetSlug = tenant.organizationSlug || organizationSlug;
  const orgId = tenant.organizationId;
  
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
          eq(hermesJourneys.organizationId, orgId),
          eq(hermesJourneys.organizationId, targetSlug),
          eq(hermesJourneys.organizationId, organizationSlug),
          eq(hermesJourneys.organizationId, 'snarai')
        )
      )
    );
  
  revalidatePath(`/portal/${organizationSlug}/journeys`);
  return { success: true };
}

export async function createJourney(
  organizationSlug: string, 
  data: { name: string; description?: string; milestones: string[] }
) {
  const { tenant } = await resolvePortalContext(organizationSlug);
  const targetSlug = tenant.organizationSlug || organizationSlug;
  const orgId = tenant.organizationId;

  const isUuid = (val?: string): boolean => 
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

  // Resolve valid foreign key reference for organizationId in projects table
  const [proj] = await db.select({ slug: projects.slug, orgId: projects.organizationId }).from(projects).where(
    or(
      eq(projects.slug, targetSlug),
      ...(isUuid(orgId) ? [eq(projects.organizationId, orgId)] : []),
      eq(projects.slug, organizationSlug),
      eq(projects.slug, 'snarai')
    )
  ).limit(1);

  const finalOrgIdentifier = proj?.slug || targetSlug || orgId;
  const journeyId = crypto.randomUUID();

  // 1. Insert Journey
  await db.insert(hermesJourneys).values({
    id: journeyId,
    organizationId: finalOrgIdentifier,
    name: data.name.trim(),
    description: data.description?.trim() || `Workflow para ${data.name.trim()}`,
    status: 'ACTIVE',
    version: 1,
    isDefault: false,
  });

  // 2. Insert Stages/Milestones
  const validMilestones = (data.milestones || []).map(m => m.trim()).filter(m => m.length > 0);
  if (validMilestones.length > 0) {
    for (let i = 0; i < validMilestones.length; i++) {
      const milestoneText = validMilestones[i] ?? 'Paso';
      await db.insert(hermesJourneyStages).values({
        id: crypto.randomUUID(),
        journeyId: journeyId,
        name: milestoneText,
        orderIndex: i + 1,
        objectives: [milestoneText],
      });
    }
  } else {
    // Default initial step
    await db.insert(hermesJourneyStages).values({
      id: crypto.randomUUID(),
      journeyId: journeyId,
      name: 'Identificar necesidades del prospecto',
      orderIndex: 1,
      objectives: ['Identificar necesidades del prospecto'],
    });
  }

  revalidatePath(`/portal/${organizationSlug}/journeys`);
  return { success: true, journeyId };
}

export async function updateJourney(
  organizationSlug: string,
  journeyId: string,
  data: { name: string; description?: string; milestones: string[] }
) {
  const { tenant } = await resolvePortalContext(organizationSlug);
  const targetSlug = tenant.organizationSlug || organizationSlug;
  const orgId = tenant.organizationId;

  // 1. Update Journey details
  await db
    .update(hermesJourneys)
    .set({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(hermesJourneys.id, journeyId),
        or(
          eq(hermesJourneys.organizationId, orgId),
          eq(hermesJourneys.organizationId, targetSlug),
          eq(hermesJourneys.organizationId, organizationSlug),
          eq(hermesJourneys.organizationId, 'snarai')
        )
      )
    );

  // 2. Refresh milestones/stages
  const validMilestones = (data.milestones || []).map(m => m.trim()).filter(m => m.length > 0);
  if (validMilestones.length > 0) {
    await db.delete(hermesJourneyStages).where(eq(hermesJourneyStages.journeyId, journeyId));

    for (let i = 0; i < validMilestones.length; i++) {
      const milestoneText = validMilestones[i] ?? 'Paso';
      await db.insert(hermesJourneyStages).values({
        id: crypto.randomUUID(),
        journeyId: journeyId,
        name: milestoneText,
        orderIndex: i + 1,
        objectives: [milestoneText],
      });
    }
  }

  revalidatePath(`/portal/${organizationSlug}/journeys`);
  return { success: true };
}

export async function deleteJourney(organizationSlug: string, journeyId: string) {
  const { tenant } = await resolvePortalContext(organizationSlug);
  const targetSlug = tenant.organizationSlug || organizationSlug;
  const orgId = tenant.organizationId;

  // Cascading deletes stages automatically due to foreign key onDelete: cascade
  await db.delete(hermesJourneyStages).where(eq(hermesJourneyStages.journeyId, journeyId));
  
  await db
    .delete(hermesJourneys)
    .where(
      and(
        eq(hermesJourneys.id, journeyId),
        or(
          eq(hermesJourneys.organizationId, orgId),
          eq(hermesJourneys.organizationId, targetSlug),
          eq(hermesJourneys.organizationId, organizationSlug),
          eq(hermesJourneys.organizationId, 'snarai')
        )
      )
    );

  revalidatePath(`/portal/${organizationSlug}/journeys`);
  return { success: true };
}
