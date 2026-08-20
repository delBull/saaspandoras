'use client';

import React, { use } from 'react';
import ChannelsDashboard from './ChannelsDashboard';

interface ChannelsPageProps {
  params: Promise<{
    organizationSlug: string;
  }>;
}

export default function ChannelsPage({ params }: ChannelsPageProps) {
  const { organizationSlug } = use(params);
  return (
    <div className="flex-1 w-full p-4 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
      <ChannelsDashboard organizationSlug={organizationSlug} />
    </div>
  );
}
