import React from 'react';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { AdminAccessGate } from '@/app/admin/AdminAccessGate';
import { HermesTenantsAdminView } from '@/components/admin/HermesTenantsAdminView';

export default async function AdminHermesPage() {
  // 1. Resolve Platform Authority Server-Side
  const auth = await getNexusAuthContext();

  // 2. Role Check (RBAC) - SUPER_ADMIN or ADMIN only
  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
    return <AdminAccessGate reason="Se requiere rol de Platform Admin (SUPER_ADMIN o ADMIN) para gestionar Hermes OS." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter">Hermes OS Control Plane</h1>
        <p className="text-zinc-400 mt-1">Supervisión, aprovisionamiento y gobernanza de IA para todos los Tenants.</p>
      </div>
      
      {/* 3. Render Dashboard */}
      <HermesTenantsAdminView />
    </div>
  );
}
