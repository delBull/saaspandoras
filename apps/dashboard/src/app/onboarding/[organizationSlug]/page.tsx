import React from 'react';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { OnboardingClient } from './OnboardingClient';
import { redirect } from 'next/navigation';

export default async function OnboardingPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;

  const [project] = await db.select({ name: projects.title })
    .from(projects)
    .where(eq(projects.slug, organizationSlug))
    .limit(1);

  if (!project) {
    redirect('/portal/error');
  }

  return <OnboardingClient organizationSlug={organizationSlug} organizationName={project.name} />;
}

