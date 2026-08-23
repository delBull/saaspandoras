import React from 'react';
import { db } from '@/db';
import { hermesKnowledge } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { PoliciesDashboard } from '@/components/hermes-portal/policies/PoliciesDashboard';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { savePolicy } from './actions';

interface PoliciesPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function PoliciesPage({ params }: PoliciesPageProps) {
  const { organizationSlug } = await params;

  let dbPolicies: any[] = [];
  try {
    const context = await resolvePortalContext(organizationSlug);
    const targetSlug = context.tenant.organizationSlug || organizationSlug;
    const orgId = context.tenant.organizationId;

    dbPolicies = await db
      .select()
      .from(hermesKnowledge)
      .where(
        and(
          or(
            eq(hermesKnowledge.organizationId, organizationSlug),
            eq(hermesKnowledge.organizationId, targetSlug),
            eq(hermesKnowledge.organizationId, orgId),
            eq(hermesKnowledge.organizationId, 'snarai')
          ),
          eq(hermesKnowledge.dimension, 'policy')
        )
      );
  } catch (error) {
    console.warn("Failed to fetch policies:", error);
  }

  const mappedPolicies = dbPolicies.map(p => ({
    id: p.id,
    key: p.key,
    content: p.content,
    status: p.status,
    updatedAt: p.updatedAt,
  }));

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
