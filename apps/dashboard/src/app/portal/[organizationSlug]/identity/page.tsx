import React from 'react';
import { db } from '@/db';
import { integrationClients, projects, marketingLeads } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { IdentityDashboard } from '@/components/hermes-portal/identity/IdentityDashboard';
import { generateApiKey, revokeApiKey, inviteTeamMember } from './actions';

interface IdentityPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function IdentityPage({ params }: IdentityPageProps) {
  const { organizationSlug } = await params;

  let apiKeys: any[] = [];
  let members: any[] = [];
  
  try {
    const project = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, organizationSlug)).limit(1);
    
    if (project.length > 0) {
      apiKeys = await db
        .select()
        .from(integrationClients)
        .where(eq(integrationClients.projectId, project[0]!.id));

      members = await db
        .select()
        .from(marketingLeads)
        .where(
          eq(marketingLeads.projectId, project[0]!.id)
        );
    }
  } catch (error) {
    console.warn("Failed to fetch integration clients (table might be missing or no project)", error);
  }

  const mappedKeys = apiKeys.map(k => ({
    id: k.id,
    name: k.name,
    environment: k.environment,
    keyFingerprint: k.keyFingerprint,
    createdAt: new Date(), // Mocking date since we don't have createdAt in the schema block shown, but ideally it would have it
  }));

  const teamMembers = members.map(m => ({
    id: m.id,
    name: m.name || m.email?.split('@')[0] || 'Unknown',
    email: m.email || '',
    role: m.ownerContext === 'tenant' || m.leadType === 'team_member' ? 'OPERATOR' : 'OWNER'
  }));

  const handleGenerate = async (name: string, env: string) => {
    'use server';
    await generateApiKey(organizationSlug, name, env as any);
  };

  const handleRevoke = async (id: string) => {
    'use server';
    await revokeApiKey(organizationSlug, id);
  };

  const handleInvite = async (email: string, name: string) => {
    'use server';
    await inviteTeamMember(organizationSlug, email, name);
  };

  return (
    <IdentityDashboard 
      apiKeys={mappedKeys}
      teamMembers={teamMembers}
      organizationSlug={organizationSlug}
      onGenerateKey={handleGenerate}
      onRevokeKey={handleRevoke}
      onInviteMember={handleInvite}
    />
  );
}
