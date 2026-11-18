/**
 * Portal Layout — Sovereign Mesh Control Plane
 * /portal/[organizationSlug]/layout.tsx
 * 
 * THE tenant boundary for the Sovereign Operating Console.
 * 
 * Responsibilities:
 * 1. Receive route organizationSlug (routing context — NOT authorization)
 * 2. Resolve PortalContext server-side
 * 3. Reject unauthorized access → redirect to login
 * 4. Render PortalShell with authorized context
 * 5. Render children within that authorized scope
 */

import { redirect } from 'next/navigation';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
// ⚠️ La clase debe venir del MISMO módulo que la lanza (resolver local):
// hay copias duplicadas en shared y en '@/lib/portal/portal-types' y
// `instanceof` falla entre copias, enviando NO_SESSION a /portal/error.
import { PortalAuthorizationError } from '@/lib/portal/portal-types';
import { PortalShell } from '@/components/hermes-portal/PortalShell';
import { recordPortalActivity } from '@/lib/portal/portal-activity';
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

  // Telemetría de acceso ("quién está dentro"). Fire-and-forget con throttle:
  // nunca debe bloquear ni romper el render del portal.
  void recordPortalActivity({
    tenantId: context.organization.slug,
    actorId: context.tenant.actorId,
  }).catch(() => undefined);

  let activeModules: string[] = [];
  try {
    const { setupProgressService } = await import('@saasfly/shared');
    const setupSummary = await setupProgressService.getEcosystemSetupState(organizationSlug);
    if (setupSummary && setupSummary.modules) {
      activeModules = setupSummary.modules.map((m: any) => m.productKey);
    }
  } catch (err) {
    console.warn('[PortalLayout] Setup summary fetch notice:', err);
  }

  return (
    <TourEngine>
      <PortalShell context={context} activeModules={activeModules}>
        {children}
      </PortalShell>
    </TourEngine>
  );
}
