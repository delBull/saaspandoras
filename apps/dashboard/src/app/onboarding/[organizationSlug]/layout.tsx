import { redirect } from 'next/navigation';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { PortalAuthorizationError } from '@/lib/portal/portal-types';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
}

export default async function OnboardingLayout({ children, params }: OnboardingLayoutProps) {
  const { organizationSlug } = await params;

  let context;
  try {
    context = await resolvePortalContext(organizationSlug);
  } catch (err) {
    if (err instanceof PortalAuthorizationError) {
      if (err.code === 'NO_SESSION' || err.code === 'INVALID_SESSION') {
        redirect(`/portal/login?return=/onboarding/${organizationSlug}`);
      }
      redirect(`/portal/unauthorized?reason=${err.code}`);
    }
    redirect('/portal/error');
  }

  // We don't render PortalShell here, giving us a clean slate for the onboarding flow.
  return (
    <div className="min-h-screen bg-[#08080A] text-white font-sans flex flex-col relative overflow-hidden">
      {children}
    </div>
  );
}
