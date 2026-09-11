import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Backwards compatibility redirect:
 * /portal/[organizationSlug]/media -> /portal/[organizationSlug]/demand
 */
export default async function MediaRedirectPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  redirect(`/portal/${organizationSlug}/demand`);
}
