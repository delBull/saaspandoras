import React from 'react';
import { DeveloperHubClient } from './DeveloperHubClient';
import { db } from '@saasfly/db-core';
import { projects } from '@saasfly/db-core';
import { eq } from "@saasfly/db-core";
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { getNexusAuthContext } from '@saasfly/shared';
import { PlatformCapabilityRegistryService } from '@saasfly/shared';
import { PlatformActor, PlatformRole } from '@saasfly/shared';
import { redirect } from 'next/navigation';

export default async function DeveloperHubPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams?.organizationSlug;

  if (!slugId) {
    redirect('/unauthorized');
  }

  // 1. Authenticate Actor
  const auth = await getNexusAuthContext();
  if (!auth.isAuthenticated) {
    redirect('/login');
  }

  const actor: PlatformActor = {
    id: auth.email || auth.wallet || 'UNKNOWN',
    role: auth.role as PlatformRole,
    actorType: 'MAGIC_LINK',
    sessionStartedAt: new Date().toISOString(),
    isDiscord2faVerified: false,
  };

  // 2. Evaluate Platform Capability Authorization (Scoped to this project)
  const evalResult = PlatformCapabilityRegistryService.evaluateAuthorization(
    actor,
    'platform.integration.keys.read',
    { tenantId: `org_${slugId}` }
  );

  if (!evalResult.granted) {
    redirect('/unauthorized');
  }

  // 3. Fetch Project
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slugId)
  });

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        Project not found for this organization.
      </div>
    );
  }

  // 4. Fetch or Ensure Public Key for this Project
  const isProduction = process.env.NODE_ENV === 'production';
  const envKey = isProduction ? 'production' : 'staging';
  
  const keyResult = await IntegrationKeyService.ensureKeyForProject(
    project.id,
    envKey,
    `Website Intake (${project.title})`,
    'public'
  );

  return (
    <DeveloperHubClient 
      organizationId={slugId} 
      projectId={project.id} 
      publicApiKey={keyResult.key || keyResult.fingerprint} 
    />
  );
}
