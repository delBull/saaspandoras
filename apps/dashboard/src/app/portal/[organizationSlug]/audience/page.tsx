import { redirect } from 'next/navigation';

export default async function AudiencePage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  redirect(`/portal/${organizationSlug}/audience/identity`);
}
