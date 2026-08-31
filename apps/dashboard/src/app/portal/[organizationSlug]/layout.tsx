/**
 * Portal Layout — Phase 6.1
 * /portal/[organizationSlug]/layout.tsx
 * 
 * THE tenant boundary for the Customer Operating Console.
 * 
 * Responsibilities:
 * 1. Receive route organizationSlug (routing context — NOT authorization)
 * 2. Resolve PortalContext server-side
 * 3. Reject unauthorized access → redirect to login
 * 4. Render PortalShell with authorized context
 * 5. Render children within that authorized scope
 * 
 * The Browser NEVER authorizes itself here. The server does.
 */

import { redirect } from 'next/navigation';
import { resolvePortalContext, getTenantOnboardingStage } from '@/lib/portal/resolve-portal-context';
import { PortalAuthorizationError } from '@/lib/portal/portal-types';
import { PortalShell } from '@/components/hermes-portal/PortalShell';
import { TourEngine } from '@/components/onboarding/TourEngine';

interface PortalLayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { organizationSlug } = await params;

  let context;
  try {
    context = await resolvePortalContext(organizationSlug);
  } catch (err) {
    if (err instanceof PortalAuthorizationError) {
      if (err.code === 'NO_SESSION' || err.code === 'INVALID_SESSION') {
        // No session → redirect to magic link login
        redirect(`/portal/login?return=/portal/${organizationSlug}`);
      }
      // Access denied (cross-tenant attack or non-existent org) → show 403
      redirect(`/portal/unauthorized?reason=${err.code}`);
    }
    // Unexpected error
    redirect('/portal/error');
  }

  // Enforce Onboarding Boundary
  const stage = await getTenantOnboardingStage(context, organizationSlug);

  if (stage && stage !== 'ACTIVATION') {
    redirect(`/onboarding/${organizationSlug}`);
  } else if (!stage && organizationSlug !== 'snarai') {
    redirect(`/onboarding/${organizationSlug}`);
  }

  return (
    <TourEngine>
      <PortalShell context={context}>
        {children}
      </PortalShell>
    </TourEngine>
  );
}
