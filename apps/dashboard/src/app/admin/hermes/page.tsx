import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { AdminAccessGate } from '../AdminAccessGate';
import HermesQAClient from './hermes-qa-client';

export default async function HermesQAPage() {
  const auth = await getNexusAuthContext();

  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
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
