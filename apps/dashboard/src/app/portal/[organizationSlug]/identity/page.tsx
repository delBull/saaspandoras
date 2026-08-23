import React from 'react';
import { db } from '@/db';
import { integrationClients, projects, marketingLeads } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { IdentityDashboard } from '@/components/hermes-portal/identity/IdentityDashboard';
import { generateApiKey, revokeApiKey, inviteTeamMember } from './actions';

interface IdentityPageProps {
  params: Promise<{ organizationSlug: string }>;
}

const isUuid = (val?: string): boolean => 
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export default async function IdentityPage({ params }: IdentityPageProps) {
  const { organizationSlug } = await params;

  let apiKeys: any[] = [];
  let members: any[] = [];
  
  try {
    const cleanSlug = organizationSlug.replace(/^org_/, '').trim();
    
    const project = await db
      .select({
        id: projects.id,
        title: projects.title,
        applicantName: projects.applicantName,
        applicantEmail: projects.applicantEmail,
        applicantPosition: projects.applicantPosition,
      })
      .from(projects)
      .where(
        or(
          eq(projects.slug, cleanSlug),
          eq(projects.slug, organizationSlug),
          ...(isUuid(organizationSlug) ? [eq(projects.organizationId, organizationSlug)] : []),
          ...(isUuid(cleanSlug) ? [eq(projects.organizationId, cleanSlug)] : [])
        )
      )
      .limit(1);
    
    if (project.length > 0) {
      const proj = project[0]!;

      apiKeys = await db
        .select()
        .from(integrationClients)
        .where(eq(integrationClients.projectId, proj.id));

      const explicitMembers = await db
        .select()
        .from(marketingLeads)
        .where(
          and(
            eq(marketingLeads.projectId, proj.id),
            or(
              eq(marketingLeads.leadType, 'team_member'),
              eq(marketingLeads.origin, 'portal_invite')
            )
          )
        );

      // Primary project owner from projects record
      const ownerEmail = proj.applicantEmail || `admin@${cleanSlug}.finance`;
      const ownerName = proj.applicantName || proj.title || 'Propietario';

      const seenEmails = new Set<string>();
      seenEmails.add(ownerEmail.toLowerCase().trim());

      members.push({
        id: `owner_${proj.id}`,
        name: ownerName,
        email: ownerEmail,
        role: 'OWNER'
      });

      for (const m of explicitMembers) {
        const email = (m.email || '').toLowerCase().trim();
        if (email && !seenEmails.has(email)) {
          seenEmails.add(email);
          members.push({
            id: m.id,
            name: m.name || email.split('@')[0] || 'Miembro',
            email: email,
            role: 'OPERATOR'
          });
        }
      }
    }
  } catch (error) {
    console.warn("Failed to fetch integration clients or team members", error);
  }

  const mappedKeys = apiKeys.map(k => ({
    id: k.id,
    name: k.name,
    environment: k.environment,
    keyFingerprint: k.keyFingerprint,
    createdAt: k.createdAt || new Date(),
  }));

  const teamMembers = members;

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
