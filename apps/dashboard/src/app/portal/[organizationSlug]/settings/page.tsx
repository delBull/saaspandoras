import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { SettingsClient, TenantSettingsData, ApiKeyItem } from './SettingsClient';
import { DashApi } from '@/lib/dash-api';

export default async function SettingsPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const portalCtx = await tryResolvePortalContext(organizationSlug);

  if (!portalCtx) {
    notFound();
  }

  // Load Settings and API Keys strictly via Dash API Service Boundary (Decoupled from DB/SQL)
  let initialData: TenantSettingsData = {
    title: portalCtx.organization.name || organizationSlug,
    tagline: '',
    description: '',
    website: '',
    whatsappPhone: '',
    telegramUrl: '',
    logoUrl: portalCtx.organization.logoUrl || '',
    runtimeConfig: {
      language: 'es',
      tonePreset: 'institutional_concierge',
      humanHandoffContact: '',
      maxResponseTokens: 1024,
    },
    apiKeys: [],
  };

  try {
    const data = await DashApi.settings.get(organizationSlug);
    if (data?.settings) {
      const keys: ApiKeyItem[] = (data.apiKeys || []).map(k => ({
        id: k.id,
        name: k.name,
        keyFingerprint: k.keyFingerprint,
        permissions: k.permissions || [],
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt || null,
        createdAt: k.createdAt,
      }));

      initialData = {
        title: data.settings.title || portalCtx.organization.name || organizationSlug,
        tagline: data.settings.tagline || '',
        description: data.settings.description || '',
        website: data.settings.website || '',
        whatsappPhone: data.settings.whatsappPhone || '',
        telegramUrl: data.settings.telegramUrl || '',
        logoUrl: portalCtx.organization.logoUrl || '',
        runtimeConfig: {
          language: 'es',
          tonePreset: 'institutional_concierge',
          humanHandoffContact: '',
          maxResponseTokens: 1024,
        },
        apiKeys: keys,
      };
    }
  } catch (err) {
    console.error('[SettingsPage] Error fetching settings via DashApi:', err);
  }

  return (
    <div className="min-h-screen bg-black">
      <SettingsClient
        organizationSlug={organizationSlug}
        initialData={initialData}
      />
    </div>
  );
}
