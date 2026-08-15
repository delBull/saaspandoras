'use server';

import { db } from '@/db';
import { integrationClients, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export async function generateApiKey(organizationSlug: string, name: string, environment: 'staging' | 'production') {
  const ctx = await resolvePortalContext(organizationSlug);

  // 1. Get the project ID
  const project = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, organizationSlug)).limit(1);
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
  
  // NOTE: In a real app we'd return the rawKey exactly once so the user can copy it!
  // But for this UI demo we just reload the page.
}

export async function revokeApiKey(organizationSlug: string, id: string) {
  const ctx = await resolvePortalContext(organizationSlug);

  const project = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, organizationSlug)).limit(1);
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
  
  const project = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, organizationSlug)).limit(1);
  if (!project.length) throw new Error("Project not found");

  const { marketingLeads } = await import('@/db/schema');
  
  // Create a record so this email can login to this project
  await db.insert(marketingLeads).values({
    projectId: project[0]!.id,
    email: email.toLowerCase().trim(),
    name,
    leadType: 'team_member',
    origin: 'portal_invite',
    ownerContext: 'tenant'
  });

  revalidatePath(`/portal/${organizationSlug}/identity`);

  // Optionally, we could trigger the Magic Link email here,
  // but just adding them to marketingLeads allows them to login via the portal.
}
