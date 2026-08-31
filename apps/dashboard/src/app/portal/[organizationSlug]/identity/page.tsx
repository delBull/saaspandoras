import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { IdentityDashboard } from '@/components/hermes-portal/identity/IdentityDashboard';
import { generateApiKey, revokeApiKey, inviteTeamMember } from './actions';
import { DashApi } from '@/lib/dash-api';

interface IdentityPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function IdentityPage({ params }: IdentityPageProps) {
  const { organizationSlug } = await params;
  const portalCtx = await tryResolvePortalContext(organizationSlug);

  if (!portalCtx) {
    notFound();
  }

  // Load Identity and API Keys strictly via Dash API Service Boundary (Decoupled from DB/SQL)
  let apiKeys: any[] = [];
  let teamMembers: any[] = [];

  try {
    const [identityData, settingsData] = await Promise.all([
      DashApi.identity.get(organizationSlug).catch(() => null),
      DashApi.settings.get(organizationSlug).catch(() => null),
    ]);

    if (identityData?.members) {
      teamMembers = identityData.members.map(m => ({
        id: m.id,
        email: m.email,
        name: m.name,
        role: m.role,
      }));
    }
    if (settingsData?.apiKeys) {
      apiKeys = settingsData.apiKeys.map(k => ({
        id: k.id,
        name: k.name,
        environment: 'production',
        keyFingerprint: k.keyFingerprint,
        createdAt: new Date(k.createdAt),
      }));
    }
  } catch (err) {
    console.error('[IdentityPage] Error fetching identity via DashApi:', err);
  }

  const handleGenerateKey = async (name: string, environment: string) => {
    'use server';
    await generateApiKey(organizationSlug, name, environment);
  };

  const handleRevokeKey = async (id: string) => {
    'use server';
    await revokeApiKey(organizationSlug, id);
  };

  const handleInviteMember = async (email: string, name: string) => {
    'use server';
    await inviteTeamMember(organizationSlug, email, name);
  };

  return (
    <IdentityDashboard
      organizationSlug={organizationSlug}
      apiKeys={apiKeys}
      teamMembers={teamMembers}
      onGenerateKey={handleGenerateKey}
      onRevokeKey={handleRevokeKey}
      onInviteMember={handleInviteMember}
    />
  );
}
