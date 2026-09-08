import { redirect } from 'next/navigation';

export default async function GrowthRedirectPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  redirect(`/growth-os/organizations/${organizationSlug}`);
}
