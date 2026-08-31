import React from 'react';
import { PoliciesDashboard } from '@/components/hermes-portal/policies/PoliciesDashboard';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { savePolicy } from './actions';
import { DashApi } from '@/lib/dash-api';

interface PoliciesPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function PoliciesPage({ params }: PoliciesPageProps) {
  const { organizationSlug } = await params;

  // 1. Auth context verification (Fail-Closed: null → clean 404)
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  if (!portalCtx) {
    notFound();
  }

  // 2. Fetch policies strictly via Dash API Service Boundary (Decoupled from DB/SQL)
  let mappedPolicies: Array<{ id: string; key: string; content: string; status: string; updatedAt: Date }> = [];
  try {
    const rawPolicies = await DashApi.policies.list(organizationSlug);
    mappedPolicies = rawPolicies.map(p => ({
      id: p.id,
      key: p.key,
      content: p.content,
      status: p.status,
      updatedAt: new Date(p.updatedAt),
    }));
  } catch (error) {
    console.warn("Failed to fetch policies via DashApi:", error);
  }

  const handleSave = async (key: string, content: string) => {
    'use server';
    await savePolicy(organizationSlug, key, content);
  };

  return (
    <PoliciesDashboard 
      policies={mappedPolicies} 
      organizationSlug={organizationSlug} 
      onSavePolicy={handleSave} 
    />
  );
}
