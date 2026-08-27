import { notFound } from 'next/navigation';
import { EnvelopeService } from '@/lib/deal-signing/envelope-service';
import { DealEnvelopeSignerClient } from './DealEnvelopeSignerClient';

export const dynamic = 'force-dynamic';

export default async function DealEnvelopePage({
  params,
  searchParams,
}: {
  params: Promise<{ envelopeId: string }>;
  searchParams: Promise<{ signerId?: string; token?: string }>;
}) {
  const { envelopeId } = await params;
  const { signerId, token } = await searchParams;

  const envelope = await EnvelopeService.getEnvelope(envelopeId);
  if (!envelope) {
    notFound();
  }

  return (
    <DealEnvelopeSignerClient
      envelope={envelope}
      initialSignerId={signerId || null}
      rawToken={token || null}
    />
  );
}
