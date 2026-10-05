import React from 'react';
import { getNexusAuthContext } from '@saasfly/shared';
import { AdminAccessGate } from '../../AdminAccessGate';
import { AdminAcademyManagersView } from '@/components/admin/views/AdminAcademyManagersView';

export const metadata = {
  title: "Academy Managers | Pandora's HQ",
};

export const dynamic = 'force-dynamic';

export default async function AcademyManagersPage() {
  const __hdrs = await import("next/headers").then(m => m.headers()); const auth = await getNexusAuthContext(await __hdrs);

  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
    return (
      <div className="p-8">
        <AdminAccessGate
          reason="Se requiere rol de SUPER_ADMIN o ADMIN para gestionar administradores de S'Narai Academy."
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <AdminAcademyManagersView />
    </div>
  );
}
