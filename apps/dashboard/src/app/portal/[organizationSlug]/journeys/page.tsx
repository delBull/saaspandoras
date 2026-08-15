import React from 'react';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { JourneysDashboard, JourneyView } from '@/components/hermes-portal/journeys/JourneysDashboard';
import { toggleJourneyState } from './actions';

interface JourneysPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function JourneysPage({ params }: JourneysPageProps) {
  const { organizationSlug } = await params;
  
  // Verify auth context
  await resolvePortalContext(organizationSlug);

  // Mock initial journeys for Phase 2 UI
  const mockJourneys: JourneyView[] = [
    {
      id: 'j-sales-prospecting',
      name: 'Sales Prospecting & Qualification',
      status: 'ACTIVE',
      milestones: [
        'Identify user pain points and needs',
        'Verify if they have budget constraints',
        'Collect email address for follow-up',
        'Present the Fast Lane investment option',
        'Close conversation and tag as Warm Lead'
      ]
    },
    {
      id: 'j-post-sale-onboarding',
      name: 'Post-Sale Onboarding (Token Holders)',
      status: 'PAUSED',
      milestones: [
        'Verify user wallet holds S-Narai tokens',
        'Explain the Governance process (DAO)',
        'Prompt to vote on active proposals',
        'Explain the rewards distribution schedule'
      ]
    },
    {
      id: 'j-support-triage',
      name: 'Level 1 Support Triage',
      status: 'DRAFT',
      milestones: [
        'Understand the technical issue',
        'Check knowledge base for known fixes',
        'If unresolved, collect reproduction steps',
        'Escalate to human support queue'
      ]
    }
  ];

  const handleToggle = async (id: string, activate: boolean) => {
    'use server';
    await toggleJourneyState(organizationSlug, id, activate);
  };

  return (
    <JourneysDashboard 
      journeys={mockJourneys}
      organizationSlug={organizationSlug}
      onToggleJourney={handleToggle}
    />
  );
}
