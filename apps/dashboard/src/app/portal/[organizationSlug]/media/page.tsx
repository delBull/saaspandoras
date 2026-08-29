import React from 'react';
import { MediaStudioDashboard } from '@/components/hermes-portal/media/MediaStudioDashboard';

export const dynamic = 'force-dynamic';

export default async function MediaStudioPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  return <MediaStudioDashboard organizationSlug={organizationSlug} />;
}
