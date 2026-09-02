import { redirect } from 'next/navigation';

export default async function EcosystemHubRedirectPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  redirect(`/ecosystem/${organizationSlug}`);
}
