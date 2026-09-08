import { redirect } from 'next/navigation';

export default async function HITLInboxRedirect({ 
  searchParams 
}: { 
  searchParams: Promise<{ tenant?: string }> 
}) {
  const resolved = await searchParams;
  const tenantSlug = resolved?.tenant || 'snarai';
  redirect(`/portal/${tenantSlug}/audience/conversations`);
}
