import { getNexusAuthContext } from '@saasfly/shared';
import { AdminAccessGate } from '../AdminAccessGate';
import HermesQAClient from './hermes-qa-client';
export default async function HermesQAPage() {
  const hdrs = await import("next/headers").then(m => m.headers());
  const auth = await getNexusAuthContext(hdrs);

  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN' && (auth.role as string) !== 'OWNER')) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu cuenta con rol '${auth.role}' no cuenta con facultades para gestionar a Hermes.`
            : 'Se requiere una sesión autenticada con privilegios de administrador.'
        }
      />
    );
  }

  return <HermesQAClient />;
}
