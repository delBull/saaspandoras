import React from 'react';
import { OnboardingClient } from './OnboardingClient';
import { redirect } from 'next/navigation';
import { ProjectRepository } from '@/lib/domain/project-repository';

export default async function OnboardingPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;

  const project = await ProjectRepository.findBySlug(organizationSlug);

  if (!project) {
    redirect('/portal/error');
  }

  return <OnboardingClient organizationSlug={organizationSlug} organizationName={project.title || organizationSlug} />;
}
