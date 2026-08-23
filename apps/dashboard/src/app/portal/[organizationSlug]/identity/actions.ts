'use server';

import { db } from '@/db';
import { integrationClients, projects, marketingLeads } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export async function generateApiKey(organizationSlug: string, name: string, environment: 'staging' | 'production') {
  const ctx = await resolvePortalContext(organizationSlug);
  const cleanSlug = organizationSlug.replace(/^org_/, '').trim();

  // 1. Get the project ID
  const project = await db.select({ id: projects.id }).from(projects).where(or(eq(projects.slug, cleanSlug), eq(projects.slug, organizationSlug))).limit(1);
  if (!project.length) throw new Error("Project not found");

  // 2. Generate key
  const rawKey = `sk_${environment}_${crypto.randomBytes(24).toString('hex')}`;
  const apiKeyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyFingerprint = crypto.createHash('md5').update(rawKey).digest('hex').slice(0, 8); // Just for display

  // 3. Insert
  await db.insert(integrationClients).values({
    name,
    environment,
    projectId: project[0]!.id,
    apiKeyHash,
    keyFingerprint,
  });

  revalidatePath(`/portal/${organizationSlug}/identity`);
}

export async function revokeApiKey(organizationSlug: string, id: string) {
  const ctx = await resolvePortalContext(organizationSlug);
  const cleanSlug = organizationSlug.replace(/^org_/, '').trim();

  const project = await db.select({ id: projects.id }).from(projects).where(or(eq(projects.slug, cleanSlug), eq(projects.slug, organizationSlug))).limit(1);
  if (!project.length) throw new Error("Project not found");

  await db.delete(integrationClients)
    .where(and(
      eq(integrationClients.id, id),
      eq(integrationClients.projectId, project[0]!.id)
    ));

  revalidatePath(`/portal/${organizationSlug}/identity`);
}

export async function inviteTeamMember(organizationSlug: string, email: string, name: string) {
  const ctx = await resolvePortalContext(organizationSlug);
  const cleanSlug = organizationSlug.replace(/^org_/, '').trim();
  
  const project = await db.select({ id: projects.id }).from(projects).where(or(eq(projects.slug, cleanSlug), eq(projects.slug, organizationSlug))).limit(1);
  if (!project.length) throw new Error("Project not found");

  // Create a record for this team member in the tenant scope
  await db.insert(marketingLeads).values({
    projectId: project[0]!.id,
    email: email.toLowerCase().trim(),
    name: name.trim(),
    leadType: 'team_member',
    origin: 'portal_invite',
    ownerContext: 'client',
    status: 'active'
  });

  revalidatePath(`/portal/${organizationSlug}/identity`);
}
