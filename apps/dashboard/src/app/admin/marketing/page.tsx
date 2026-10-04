import React from 'react';
import { getNexusAuthContext } from '@saasfly/shared';
import { MarketingDashboard } from '@/components/admin/marketing/MarketingDashboard';
import { AdminAccessGate } from '../AdminAccessGate';
import { db } from '@saasfly/db-core';
import { projects, marketingLeads } from '@saasfly/db-core';
import { eq, desc } from "@saasfly/db-core";

export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  // 1. Resolve Platform Authority Server-Side
  const auth = await getNexusAuthContext();

  // Rol permitido: SUPER_ADMIN, ADMIN, MARKETING
  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN' && auth.role !== 'MARKETING')) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu cuenta con rol '${auth.role}' no cuenta con facultades de marketing de plataforma.`
            : 'Se requiere una sesión autenticada con privilegios operativos.'
        }
      />
    );
  }

  // 2. Fetch the HQ Tenant (pandoras)
  const hqProjectRows = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, 'pandoras')).limit(1);
  const projectId = hqProjectRows[0]?.id ?? 0;

  // 3. Fetch CRM Leads
  const leadsRows = await db
    .select()
    .from(marketingLeads)
    .where(eq(marketingLeads.scope, 'b2b'))
    .orderBy(desc(marketingLeads.createdAt));

  const serializedLeads = JSON.parse(JSON.stringify(leadsRows));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <MarketingDashboard projectId={projectId} leads={serializedLeads} />
    </div>
  );
}
