import React from 'react';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformAdminShell } from '@/components/admin/shell/PlatformAdminShell';
import { PlatformActor, PlatformRole } from '@/lib/dash-contracts/admin';
import { AdminAccessGate } from './AdminAccessGate';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Resolve Platform Authority Server-Side
  const auth = await getNexusAuthContext();

  if (!auth.isAuthenticated) {
    return (
      <AdminAccessGate reason="Se requiere una sesión autenticada para acceder al administrador." />
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
    <PlatformAdminShell actor={actor}>
      {children}
    </PlatformAdminShell>
  );
}
