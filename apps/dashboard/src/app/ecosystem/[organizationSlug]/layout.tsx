import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { EcosystemHeader } from '@/components/ecosystem/EcosystemHeader';
import { EcosystemFooter } from '@/components/ecosystem/EcosystemFooter';

export const dynamic = 'force-dynamic';

interface EcosystemLayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
}

export default async function EcosystemLayout({
  children,
  params,
}: EcosystemLayoutProps) {
  const { organizationSlug } = await params;
  const context = await resolvePortalContext(organizationSlug);

  if (!context) {
    redirect(`/portal/login?return=/ecosystem/${organizationSlug}`);
  }

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Navbar */}
      <EcosystemHeader organization={context.organization} organizationSlug={organizationSlug} />

      {/* Main Orchestration Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {children}
      </main>

      {/* Bottom Footbar */}
      <EcosystemFooter organization={context.organization} />
    </div>
  );
}
