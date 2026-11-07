import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getNexusAuthContext } from '@saasfly/shared';
import { NexusPaymentsClient } from './NexusPaymentsClient';

export const dynamic = 'force-dynamic';

/**
 * /nexus/payments — Piloto de cobro con tarjeta (solo SUPER_ADMIN).
 *
 * La autorización se resuelve en el servidor: la página ni siquiera se renderiza
 * para otra identidad. La API que crea los links vuelve a validar (defensa en
 * profundidad: esconder la UI no es autorización).
 */
export default async function NexusPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const reqHeaders = await headers();
  const auth = await getNexusAuthContext(reqHeaders, token, 'NEXUS');

  if (!auth.isAuthenticated || auth.role !== 'SUPER_ADMIN') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#08080A] text-white">
      <NexusPaymentsClient
        operator={{
          email: auth.email ?? null,
          wallet: auth.wallet ?? null,
        }}
      />
    </div>
  );
}
