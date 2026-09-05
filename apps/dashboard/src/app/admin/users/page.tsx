import React from 'react';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformAdminShell } from '@/components/admin/shell/PlatformAdminShell';
import { UsersTable } from '@/components/admin/UsersTable';
import { AdminAccessGate } from '../AdminAccessGate';
import { PlatformActor, PlatformRole } from '@/lib/dash-contracts/admin';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';
import type { UserData, UserRole } from '@/types/admin';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  // 1. Resolve Platform Authority Server-Side
  const auth = await getNexusAuthContext();

  // Rol permitido: SUPER_ADMIN, ADMIN (Mapeado a AUDITOR en PlatformRole)
  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu cuenta con rol '${auth.role}' no cuenta con facultades para auditar usuarios globales.`
            : 'Se requiere una sesión autenticada con privilegios de administrador/auditor.'
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
    name: auth.wallet ? `${auth.wallet.slice(0, 6)}...${auth.wallet.slice(-4)}` : 'Auditor',
    sessionStartedAt: new Date().toISOString(),
    isDiscord2faVerified: auth.role === 'SUPER_ADMIN',
  };

  // 3. Fetch Users
  const usersRows = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(500); // Acotar por performance

  const usersList: UserData[] = usersRows.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    walletAddress: u.walletAddress || '',
    hasPandorasKey: u.hasPandorasKey || false,
    connectionCount: 1, // fallback
    lastConnectionAt: new Date().toISOString(),
    createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
    role: (u.role || 'user') as UserRole,
    capabilities: (u.capabilities as Record<string, boolean>) || {},
    projectCount: 0,
    kycLevel: (u.kycLevel || 'N/A') as 'basic' | 'N/A',
    kycCompleted: u.kycCompleted || false,
    telegramId: u.telegramId,
  }));

  return (
    <PlatformAdminShell actor={actor} activeSection="identity">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Directorio Global de Usuarios</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Registro canónico de identidades, billeteras y estado KYC en Pandora's.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs font-semibold">
            {usersList.length} Registros Activos
          </span>
        </div>
        
        <UsersTable users={usersList} currentActor={actor} />
      </div>
    </PlatformAdminShell>
  );
}
