'use client';

import React from 'react';
import ChannelsDashboard from './ChannelsDashboard';

interface ChannelsPageProps {
  params: {
    organizationSlug: string;
  };
}

export default function ChannelsPage({ params }: ChannelsPageProps) {
  return (
    <div className="flex-1 w-full p-4 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
      <ChannelsDashboard organizationSlug={params.organizationSlug} />
    </div>
  );
}
