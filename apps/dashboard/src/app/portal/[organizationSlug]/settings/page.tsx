import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { SettingsClient, TenantSettingsData, ApiKeyItem } from './SettingsClient';
import { db } from '@/db';
import { projects, integrationClients } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';

export default async function SettingsPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const portalCtx = await tryResolvePortalContext(organizationSlug);

  if (!portalCtx) {
    notFound();
  }

  const projectId = portalCtx.organization.projectId;
  const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // Load project details
  const [project] = await db
    .select()
    .from(projects)
    .where(
      or(
        eq(projects.slug, organizationSlug),
        ...(projectId ? [eq(projects.id, Number(projectId))] : []),
        ...(isUuid(organizationSlug) ? [eq(projects.organizationId, organizationSlug)] : [])
      )
    )
    .limit(1);

  if (!project) {
    notFound();
  }

  // Load active API keys for this project
  const rawKeys = await db
    .select()
    .from(integrationClients)
    .where(eq(integrationClients.projectId, project.id))
    .orderBy(desc(integrationClients.createdAt));

  const apiKeys: ApiKeyItem[] = rawKeys.map((k) => ({
    id: k.id,
    name: k.name,
    keyFingerprint: k.keyFingerprint,
    permissions: (k.permissions as string[]) || [],
    isActive: k.isActive,
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
    createdAt: k.createdAt.toISOString(),
  }));

  const initialData: TenantSettingsData = {
    title: project.title || '',
    tagline: project.tagline || '',
    description: project.description || '',
    website: project.website || '',
    whatsappPhone: project.whatsappPhone || '',
    telegramUrl: project.telegramUrl || '',
    logoUrl: project.logoUrl || '',
    runtimeConfig: (project.tenantRuntimeConfig as any) || {},
    apiKeys,
  };

  return (
    <div className="min-h-screen bg-black">
      <SettingsClient
        organizationSlug={organizationSlug}
        initialData={initialData}
      />
    </div>
  );
}
