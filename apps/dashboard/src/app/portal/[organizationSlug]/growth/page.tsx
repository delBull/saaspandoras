import { redirect } from 'next/navigation';

export default async function GrowthPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  redirect(`/portal/${organizationSlug}/growth/marketing`);
}
