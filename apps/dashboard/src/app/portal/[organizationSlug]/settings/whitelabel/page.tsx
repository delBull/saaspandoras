import React from 'react';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { redirect } from 'next/navigation';
import { AdminWhitelabelConfig } from '@/components/admin/inspector/AdminWhitelabelConfig';

interface WhitelabelSettingsPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function WhitelabelSettingsPage({ params }: WhitelabelSettingsPageProps) {
  const { organizationSlug } = await params;
  
  // 1. Resolve Auth & Tenant Context (throws on failure)
  const context = await resolvePortalContext(organizationSlug);
  
  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
          Whitelabel Configuration
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Personaliza la apariencia de tu portal público. Configura tu dominio personalizado, logo, y colores de marca.
        </p>
      </div>
      
      <div className="pt-4 max-w-4xl">
        <AdminWhitelabelConfig tenantSlug={organizationSlug} />
      </div>
    </div>
  );
}
