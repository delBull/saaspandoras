import React from 'react';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformAdminShell } from '@/components/admin/shell/PlatformAdminShell';
import { MarketingDashboard } from '@/components/admin/marketing/MarketingDashboard';
import { AdminAccessGate } from '../AdminAccessGate';
import { PlatformActor, PlatformRole } from '@/lib/dash-contracts/admin';

export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  // 1. Resolve Platform Authority Server-Side
  const auth = await getNexusAuthContext();

  // Rol permitido: PLATFORM_ADMIN, OPERATOR (y SUPER_ADMIN)
  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN' && auth.role !== 'OPERATOR' && auth.role !== 'MARKETING')) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu cuenta con rol '${auth.role}' no cuenta con facultades de marketing de plataforma.`
            : 'Se requiere una sesión autenticada con privilegios operativos.'
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
    name: auth.wallet ? `${auth.wallet.slice(0, 6)}...${auth.wallet.slice(-4)}` : 'Operador',
    sessionStartedAt: new Date().toISOString(),
    isDiscord2faVerified: auth.role === 'SUPER_ADMIN',
  };

  return (
    <PlatformAdminShell actor={actor} activeSection="marketing">
      <MarketingDashboard />
    </PlatformAdminShell>
  );
}
