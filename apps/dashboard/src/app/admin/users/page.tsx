import React from 'react';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformAdminShell } from '@/components/admin/shell/PlatformAdminShell';
import { UsersTable } from '@/components/admin/UsersTable';
import { AdminAccessGate } from '../AdminAccessGate';
import { PlatformActor, PlatformRole } from '@/lib/dash-contracts/admin';
import { db } from '@/db';
import { users, hermesCognitiveProfiles, marketingIdentities, channelIdentityBindings, hermesSecurityEvents } from '@/db/schema';
import { desc, inArray, eq, sql } from 'drizzle-orm';
import type { UserData, UserRole } from '@/types/admin';
import { Fingerprint, ShieldAlert, Link2, Wallet, Users as UsersIcon } from 'lucide-react';

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

  // 3. Fetch Users & Identity Graph Telemetry in Parallel
  const [
    usersRows,
    identitiesCountRes,
    bindingsCountRes,
    collisionsCountRes,
  ] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(500),
    db.select({ count: sql<number>`cast(count(*) as integer)` }).from(marketingIdentities).catch(() => [{ count: 0 }]),
    db.select({ count: sql<number>`cast(count(*) as integer)` }).from(channelIdentityBindings).catch(() => [{ count: 0 }]),
    db.select({ count: sql<number>`cast(count(*) as integer)` })
      .from(hermesSecurityEvents)
      .where(eq(hermesSecurityEvents.eventType, 'IDENTITY_COLLISION_BLOCKED'))
      .catch(() => [{ count: 0 }]),
  ]);

  const totalCanonicalIdentities = identitiesCountRes[0]?.count || 0;
  const totalChannelBindings = bindingsCountRes[0]?.count || 0;
  const totalBlockedCollisions = collisionsCountRes[0]?.count || 0;

  // Fetch cognitive profiles for these users
  const userIds = usersRows.map(u => u.id);
  let cognitiveSet = new Set<string>();
  if (userIds.length > 0) {
    const cognitiveRows = await db
      .select({ userId: hermesCognitiveProfiles.userId })
      .from(hermesCognitiveProfiles)
      .where(inArray(hermesCognitiveProfiles.userId, userIds));
    cognitiveRows.forEach(row => cognitiveSet.add(row.userId));
  }

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
    capabilities: {},
    projectCount: 0,
    kycLevel: (u.kycLevel || 'N/A') as 'basic' | 'N/A',
    kycCompleted: u.kycCompleted || false,
    telegramId: u.telegramId,
    hasCognitiveProfile: cognitiveSet.has(u.id) || (u.email ? cognitiveSet.has(u.email) : false) || (u.walletAddress ? cognitiveSet.has(u.walletAddress) : false),
  }));

  const walletsCount = usersList.filter(u => Boolean(u.walletAddress)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Fingerprint className="w-7 h-7 text-cyan-400" />
            Directorio Global de Usuarios & Sovereign Identity
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Registro canónico de identidades omnicanal, billeteras Web3, perfiles cognitivos y defensas activas.
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs font-semibold self-start md:self-auto">
          {usersList.length} Registros Activos
        </span>
      </div>

      {/* Identity Graph KPI Telemetry */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0C0C12] border border-white/[0.08] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Identidades Canónicas</span>
            <UsersIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {totalCanonicalIdentities}
          </div>
          <span className="text-[10px] text-zinc-500">Identity Graph Core (F1)</span>
        </div>

        <div className="bg-[#0C0C12] border border-white/[0.08] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Canales Enlazados</span>
            <Link2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-2">
            {totalChannelBindings}
          </div>
          <span className="text-[10px] text-sky-500/60 font-mono">Telegram • Web • Phone</span>
        </div>

        <div className="bg-[#0C0C12] border border-white/[0.08] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Wallets Activas</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {walletsCount}
          </div>
          <span className="text-[10px] text-emerald-500/60 font-mono">Web3 Identified</span>
        </div>

        <div className="bg-[#0C0C12] border border-white/[0.08] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Colisiones Bloqueadas</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {totalBlockedCollisions}
          </div>
          <span className="text-[10px] text-rose-500/60 font-mono">Anti-Merge Protected</span>
        </div>
      </div>
      
      {/* Users Table */}
      <UsersTable users={usersList} currentActor={actor} />
    </div>
  );
}
