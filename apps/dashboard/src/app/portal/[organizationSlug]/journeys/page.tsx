import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { JourneysDashboard, JourneyView } from '@/components/hermes-portal/journeys/JourneysDashboard';
import { toggleJourneyState } from './actions';
import { DashApi } from '@/lib/dash-api';

interface JourneysPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function JourneysPage({ params }: JourneysPageProps) {
  const { organizationSlug } = await params;
  
  // 1. Verify auth context (Fail-Closed: null → clean 404 instead of 500)
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  if (!portalCtx) {
    notFound();
  }

  // 2. Fetch journeys strictly via Dash API Service Boundary (Decoupled from DB/SQL)
  let journeysList: JourneyView[] = [];
  try {
    const dtoArray = await DashApi.journeys.list(organizationSlug);
    journeysList = dtoArray.map((j) => ({
      id: j.id,
      name: j.name,
      description: j.description,
      status: (j.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED' | 'DRAFT',
      milestones: j.milestones && j.milestones.length > 0 ? j.milestones : [j.description || 'Proceso en curso'],
    }));
  } catch (err) {
    console.error('[JourneysPage] Error fetching via DashApi:', err);
  }

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
