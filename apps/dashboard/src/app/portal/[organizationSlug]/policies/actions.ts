'use server';

import { db } from '@/db';
import { hermesKnowledge } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import crypto from 'crypto';

export async function savePolicy(organizationSlug: string, key: string, content: string) {
  const ctx = await resolvePortalContext(organizationSlug);

  try {
    // Basic upsert simulation
    // Ideally this uses Drizzle's ON CONFLICT DO UPDATE, but we'll do a simple delete/insert for the demo
    await db.delete(hermesKnowledge).where(
      and(
        eq(hermesKnowledge.organizationId, organizationSlug),
        eq(hermesKnowledge.dimension, 'policy'),
        eq(hermesKnowledge.key, key)
      )
    );

    await db.insert(hermesKnowledge).values({
      id: crypto.randomUUID(),
      organizationId: organizationSlug,
      dimension: 'policy',
      key,
      content,
      status: 'ACTIVE',
      visibility: 'PRIVATE',
      authority: 'TENANT',
      version: 1,
      source: 'PORTAL_UI',
      sourceReference: 'manual_override',
      createdBy: 'system'
    });
  } catch (error) {
    console.error("Failed to save policy", error);
    throw new Error("Failed to save policy to knowledge base");
  }
}
