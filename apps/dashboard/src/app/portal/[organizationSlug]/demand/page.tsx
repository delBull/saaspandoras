import React from 'react';
import { DemandDistributionConsole } from '@/components/hermes-portal/demand/DemandDistributionConsole';

export const dynamic = 'force-dynamic';

export default async function DemandDistributionPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  return <DemandDistributionConsole organizationSlug={organizationSlug} />;
}
