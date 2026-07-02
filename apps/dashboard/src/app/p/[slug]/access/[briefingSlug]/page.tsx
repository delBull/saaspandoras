import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { projects, projectBriefings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { BriefingRenderer } from '@/components/briefings/BriefingRenderer';

export default async function BriefingPage({ params }: { params: { slug: string; briefingSlug: string } }) {
  const { slug, briefingSlug } = await params;

  // 1. Validate project
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });

  if (!project) {
    notFound();
  }

  // 2. Fetch specific briefing
  const briefing = await db.query.projectBriefings.findFirst({
    where: and(
      eq(projectBriefings.projectId, project.id),
      eq(projectBriefings.slug, briefingSlug),
      eq(projectBriefings.status, 'published')
    ),
  });

  if (!briefing) {
    notFound();
  }

  // Cast blocks to expected type (usually JSONB maps directly to array in Drizzle, but just in case)
  const blocks = Array.isArray(briefing.blocks) ? briefing.blocks : [];

  return (
    <>
      <BriefingRenderer blocks={blocks} projectSlug={slug} />
    </>
  );
}
