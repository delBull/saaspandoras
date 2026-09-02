import React from 'react';
import { cookies, headers } from 'next/headers';
import EcosystemPage from '../ecosystem/[organizationSlug]/page';
import { ConsumerHomePage } from '@/components/consumer-home/ConsumerHomePage';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ view?: string; slug?: string }>;
}

export default async function RootDashboardPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const headerList = await headers();
  const host = headerList.get('host') || '';

  // If accessed via app.pandoras.finance or explicit consumer view query param
  if (host.startsWith('app.') || params.view === 'consumer') {
    return <ConsumerHomePage />;
  }

  // dash.pandoras.finance serves the Sovereign Ecosystem Hub
  // Resolve the organization slug (from query param, cookies, or default to 'snarai')
  let resolvedSlug = params.slug || 'snarai';

  try {
    const cookieStore = await cookies();
    const cookieSlug =
      cookieStore.get('snarai_project_slug')?.value ||
      cookieStore.get('pd_current_tenant')?.value ||
      cookieStore.get('portal_slug')?.value;

    if (cookieSlug && !params.slug) {
      resolvedSlug = cookieSlug;
    }
  } catch (err) {
    console.warn('[RootDashboardPage] Cookie read notice:', err);
  }

  return (
    <div className="min-h-screen bg-[#060608] text-white p-4 sm:p-8 max-w-7xl mx-auto">
      <EcosystemPage params={Promise.resolve({ organizationSlug: resolvedSlug })} />
    </div>
  );
}
