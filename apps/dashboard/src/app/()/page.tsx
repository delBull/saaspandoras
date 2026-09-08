import React from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ConsumerHomePage } from '@/components/consumer-home/ConsumerHomePage';
import { tryResolvePortalContext, getTenantOnboardingStage } from '@/lib/portal/resolve-portal-context';
import { db } from '@/db';
import { projects, daoMembers } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ view?: string; slug?: string }>;
}

async function getDefaultTenantForWallet(wallet: string): Promise<string | null> {
  if (!wallet) return null;
  try {
    // Check if wallet is owner
    const owned = await db.select({ slug: projects.slug })
      .from(projects)
      .where(ilike(projects.applicantWalletAddress, wallet))
      .limit(1);
    if (owned[0]) return owned[0].slug;

    // Check if wallet is DAO member
    const member = await db.select({ slug: projects.slug })
      .from(daoMembers)
      .innerJoin(projects, eq(daoMembers.projectId, projects.id))
      .where(ilike(daoMembers.wallet, wallet))
      .limit(1);
    if (member[0]) return member[0].slug;
  } catch (err) {
    console.warn('[getDefaultTenantForWallet] Error:', err);
  }
  return null;
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

  // 1. Resolve explicit slug from URL or cookies
  let explicitSlug = params.slug;
  if (!explicitSlug) {
    try {
      const cookieStore = await cookies();
      const cookieSlug =
        cookieStore.get('pd_current_tenant')?.value ||
        cookieStore.get('portal_slug')?.value ||
        cookieStore.get('snarai_project_slug')?.value;
      if (cookieSlug) explicitSlug = cookieSlug;
    } catch (err) {}
  }

  // 2. Fetch auth state
  const { getAuth, isAdmin } = await import('@/lib/auth');
  const authResult = await getAuth(headerList).catch(() => ({ session: null }));
  
  const callerWallet =
    (authResult as any).session?.address?.toLowerCase() ||
    headerList.get('x-wallet-address')?.toLowerCase() ||
    headerList.get('x-thirdweb-address')?.toLowerCase();

  const userIsAdmin = callerWallet ? await isAdmin(callerWallet) : false;

  // 3. Resolve final target slug dynamically
  let resolvedSlug = explicitSlug;

  if (!resolvedSlug) {
    if (userIsAdmin) {
      resolvedSlug = 'pandoras'; // Master tenant for superadmins
    } else if (callerWallet) {
      // Find what tenant they belong to
      resolvedSlug = (await getDefaultTenantForWallet(callerWallet)) || undefined;
    }
  }

  // 4. If absolutely no slug can be resolved, they have no access. Send to login.
  if (!resolvedSlug) {
    redirect('/accessv2');
  }

  // 5. Try to resolve the portal context for the resolved slug
  const context = await tryResolvePortalContext(resolvedSlug);

  if (!context) {
    redirect(`/accessv2?return=/ecosystem/${resolvedSlug}`);
  }

  try {
    const stage = await getTenantOnboardingStage(context, resolvedSlug);
    if (stage && stage !== 'completed' && !userIsAdmin) {
      redirect('/onboarding');
    }
  } catch (err) {
    console.warn('[RootDashboardPage] Onboarding check failed:', err);
  }

  redirect(`/ecosystem/${resolvedSlug}`);
}
