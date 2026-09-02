import { redirect } from 'next/navigation';

export default async function PortalRootPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  redirect(`/portal/${organizationSlug || ''}/overview`);
}
