import { redirect } from 'next/navigation';

export default async function LegacyOnboardingRedirectPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  redirect(`/portal/${organizationSlug || ''}/ecosystem?setup=true`);
}
