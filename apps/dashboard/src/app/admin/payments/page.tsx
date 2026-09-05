import React from 'react';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformAdminShell } from '@/components/admin/shell/PlatformAdminShell';
import { PaymentsDashboard } from '@/components/admin/payments/PaymentsDashboard';
import { AdminAccessGate } from '../AdminAccessGate';
import { PlatformActor, PlatformRole } from '@/lib/dash-contracts/admin';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  // 1. Resolve Platform Authority Server-Side
  const auth = await getNexusAuthContext();

  // Rol permitido: SUPER_ADMIN, PLATFORM_ADMIN
  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu cuenta con rol '${auth.role}' no cuenta con facultades de tesorería y facturación.`
            : 'Se requiere una sesión autenticada con privilegios de administrador de plataforma.'
        }
      />
    );
  }

  // 2. Assemble Current Platform Actor
  const actor: PlatformActor = {
    id: auth.wallet || auth.email || 'platform_admin',
    actorType: auth.wallet ? 'WALLET' : 'MAGIC_LINK',
    role: auth.role as PlatformRole,
    walletAddress: auth.wallet || null,
    email: auth.email || null,
    name: auth.wallet ? `${auth.wallet.slice(0, 6)}...${auth.wallet.slice(-4)}` : 'Admin',
    sessionStartedAt: new Date().toISOString(),
    isDiscord2faVerified: auth.role === 'SUPER_ADMIN',
  };

  return (
    <PlatformAdminShell actor={actor} activeSection="billing">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Tesorería & Enlaces de Pago</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gestión de facturación global y enlaces directos de pago para servicios y tenants.
          </p>
        </div>
        
        <PaymentsDashboard />
      </div>
    </PlatformAdminShell>
  );
}
