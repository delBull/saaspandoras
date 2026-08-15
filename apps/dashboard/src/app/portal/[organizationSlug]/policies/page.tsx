import React from 'react';
import { db } from '@/db';
import { hermesKnowledge } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { PoliciesDashboard } from '@/components/hermes-portal/policies/PoliciesDashboard';
import { savePolicy } from './actions';

interface PoliciesPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function PoliciesPage({ params }: PoliciesPageProps) {
  const { organizationSlug } = await params;

  let dbPolicies: any[] = [];
  try {
    dbPolicies = await db
      .select()
      .from(hermesKnowledge)
      .where(
        and(
          eq(hermesKnowledge.organizationId, organizationSlug),
          eq(hermesKnowledge.dimension, 'policy')
        )
      );
  } catch (error) {
    console.warn("Failed to fetch policies (table might be missing)", error);
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
