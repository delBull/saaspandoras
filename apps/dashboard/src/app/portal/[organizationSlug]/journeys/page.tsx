import React from 'react';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { JourneysDashboard, JourneyView } from '@/components/hermes-portal/journeys/JourneysDashboard';
import { toggleJourneyState } from './actions';
import { db } from '@/db';
import { hermesJourneys, hermesJourneyStages } from '@/db/schema';
import { eq, or, asc } from 'drizzle-orm';

interface JourneysPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function JourneysPage({ params }: JourneysPageProps) {
  const { organizationSlug } = await params;
  
  // 1. Verify auth context and resolve tenant
  const { tenant } = await resolvePortalContext(organizationSlug);

  const targetSlug = tenant.organizationSlug || organizationSlug;
  const orgId = tenant.organizationId;

  // 2. Fetch real persistent journeys from DB
  const dbJourneys = await db
    .select()
    .from(hermesJourneys)
    .where(
      or(
        eq(hermesJourneys.organizationId, orgId),
        eq(hermesJourneys.organizationId, targetSlug),
        eq(hermesJourneys.organizationId, organizationSlug),
        eq(hermesJourneys.organizationId, 'snarai')
      )
    )
    .orderBy(asc(hermesJourneys.createdAt));

  // 3. For each journey, fetch its stages and objectives
  const journeysList: JourneyView[] = await Promise.all(
    dbJourneys.map(async (j) => {
      const stages = await db
        .select()
        .from(hermesJourneyStages)
        .where(eq(hermesJourneyStages.journeyId, j.id))
        .orderBy(asc(hermesJourneyStages.orderIndex));

      // Flatten objectives across all stages to build milestones
      const milestones: string[] = [];
      for (const s of stages) {
        const objs = Array.isArray(s.objectives) ? (s.objectives as string[]) : [];
        if (objs.length > 0) {
          milestones.push(...objs);
        } else {
          milestones.push(s.name);
        }
      }

      return {
        id: j.id,
        name: j.name,
        description: j.description || undefined,
        status: (j.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED' | 'DRAFT',
        milestones: milestones.length > 0 ? milestones : [j.description || 'Proceso en curso'],
      };
    })
  );

  const handleToggle = async (id: string, activate: boolean) => {
    'use server';
    await toggleJourneyState(organizationSlug, id, activate);
  };

  return (
    <JourneysDashboard 
      journeys={journeysList}
      organizationSlug={organizationSlug}
      onToggleJourney={handleToggle}
    />
  );
}
