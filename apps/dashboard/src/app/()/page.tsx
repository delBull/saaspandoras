import React from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ConsumerHomePage } from '@/components/consumer-home/ConsumerHomePage';
import { tryResolvePortalContext, getTenantOnboardingStage } from '@/lib/portal/resolve-portal-context';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ view?: string; slug?: string }>;
}

export default async function RootDashboardPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || '';

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

  // Check if they have an active portal context and onboarding state
  const context = await tryResolvePortalContext(resolvedSlug);
  
  if (!context) {
    // If they have no access, send them to login
    redirect(`/accessv2?return=/ecosystem/${resolvedSlug}`);
  }

  // Check onboarding stage
  const stage = await getTenantOnboardingStage(context, resolvedSlug);
  
  // Check if user is an admin to skip onboarding
  let userIsAdmin = false;
  try {
    const { getAuth, isAdmin } = await import('@/lib/auth');
    const hdrs = await headers();
    const auth = await getAuth(hdrs);
    const callerWallet = auth.session?.address?.toLowerCase() ||
        hdrs.get('x-wallet-address')?.toLowerCase() ||
        hdrs.get('x-thirdweb-address')?.toLowerCase();
    
    if (callerWallet) {
      userIsAdmin = await isAdmin(callerWallet);
    }
  } catch (err) {
    console.warn('[RootDashboardPage] Admin check failed:', err);
  }

  // Si no ha terminado el onboarding, y no es admin, lo mandamos allá
  if (stage && stage !== 'completed' && !userIsAdmin) {
    redirect('/onboarding');
  }

  // Si ya terminó (o no tiene stage pendiente), redirigir al Ecosystem Hub real
  // Esto escapa del layout () legacy y usa el nuevo layout de ecosystem
  redirect(`/ecosystem/${resolvedSlug}`);
}
