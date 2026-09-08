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
  const [params, headerList] = await Promise.all([
    searchParams ? searchParams : Promise.resolve({} as { view?: string; slug?: string }),
    headers(),
  ]);

  const host = headerList.get('x-forwarded-host') || headerList.get('host') || '';

  // If accessed via app.pandoras.finance or explicit consumer view query param
  if (host.startsWith('app.') || params.view === 'consumer') {
    return <ConsumerHomePage />;
  }

  // Resolve slug from params or cookies
  let resolvedSlug = params.slug || 'snarai';
  try {
    const cookieStore = await cookies();
    const cookieSlug =
      cookieStore.get('snarai_project_slug')?.value ||
      cookieStore.get('pd_current_tenant')?.value ||
      cookieStore.get('portal_slug')?.value;
    if (cookieSlug && !params.slug) resolvedSlug = cookieSlug;
  } catch (err) {
    console.warn('[RootDashboardPage] Cookie read notice:', err);
  }

  // ── Paralelizar: portal context + auth en una sola ronda ──────────────
  // Antes: getAuth se llamaba 2 veces en serie (dentro de resolvePortalContext
  // y luego explícitamente en el isAdmin check). Ahora se ejecutan en paralelo
  // y se reutiliza el resultado de auth para ambas verificaciones.
  const { getAuth, isAdmin } = await import('@/lib/auth');

  const [context, authResult] = await Promise.all([
    tryResolvePortalContext(resolvedSlug),
    getAuth(headerList).catch(() => ({ session: null })),
  ]);

  if (!context) {
    redirect(`/accessv2?return=/ecosystem/${resolvedSlug}`);
  }

  try {
    const callerWallet =
      (authResult as any).session?.address?.toLowerCase() ||
      headerList.get('x-wallet-address')?.toLowerCase() ||
      headerList.get('x-thirdweb-address')?.toLowerCase();

    if (callerWallet) {
      // isAdmin + getTenantOnboardingStage en paralelo (antes secuencial)
      const [stage, userIsAdmin] = await Promise.all([
        getTenantOnboardingStage(context, resolvedSlug),
        isAdmin(callerWallet),
      ]);

      if (stage && stage !== 'completed' && !userIsAdmin) {
        redirect('/onboarding');
      }
    } else {
      const stage = await getTenantOnboardingStage(context, resolvedSlug);
      if (stage && stage !== 'completed') {
        redirect('/onboarding');
      }
    }
  } catch (err) {
    console.warn('[RootDashboardPage] Admin/onboarding check failed:', err);
  }

  redirect(`/ecosystem/${resolvedSlug}`);
}
