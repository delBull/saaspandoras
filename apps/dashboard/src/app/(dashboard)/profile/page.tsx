'use client';

import React, { useState } from 'react';
import { ArrowLeftIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { useActiveAccount } from 'thirdweb/react';
// 🎮 IMPORTAR COMPONENTES Y HOOKS REALES DE GAMIFICACIÓN
import { useRealGamification } from '@/hooks/useRealGamification';
import { ReferralShareCard } from '@/components/ReferralShareCard';
import { ReferralsCard } from '../../../components/ReferralsCard';
// Importar componentes de perfil
import {
  ProfileHeader,
  WalletInfo,
  BasicInfo,
  KycInfo,
  AddressInfo,
  AccountStatus,
  WalletSecurity,
  KycModal
} from '@/components/profile';

// Extended UserAchievement type with achievement details (for type assertion)
interface ExtendedUserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  isCompleted: boolean;
  completedAt?: Date;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  unlockedAt?: Date;
  metadata?: Record<string, any>;
}

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const { profile, isLoading, isError } = useProfile();
  const account = useActiveAccount();
  const [kycModalOpen, setKycModalOpen] = useState(false);

  // Use account from useActiveAccount hook instead of cookies
  const walletAddress = account?.address;

  // 🎮 CONTEXTO DE GAMIFICACIÓN REAL
  const gamification = useRealGamification(walletAddress);

  // Unified loading state - wait for both profile and gamification data
  const isPageLoading = isLoading || (!profile && !walletAddress) || (walletAddress && !gamification);

  if (isPageLoading) {
    return (
      <div className="py-4 px-2 md:px-6">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-700 rounded mb-4 w-64"></div>
          <div className="space-y-4">
            <div className="h-32 bg-zinc-700 rounded"></div>
            <div className="h-48 bg-zinc-700 rounded"></div>
            <div className="h-64 bg-zinc-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Only deny access if there's a REAL error
  if (isError && !profile && !walletAddress) {
    return (
      <div className="py-4 px-2 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>No se encontró tu sesión. Conéctate a tu wallet para ver tu perfil.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  console.log('🎮 RENDER PAGE: gamification context', gamification);
  console.log('🎮 RENDER PAGE: achievements length', gamification?.achievements?.length);

  return (
    <div className="py-4 px-2 md:p-6 space-y-6 pb-20 md:pb-6">
      {/* Back Button - Mobile & Desktop */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => window.history.back()}
          className="text-gray-400 hover:text-white transition-colors z-40"
          aria-label="Volver atrás"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Perfil de Usuario</h1>
          <p className="text-gray-400">Gestiona tu información personal y configuraciones de cuenta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo - Wallet Info + Security */}
        <div className="space-y-4">
          <WalletInfo
            walletAddress={walletAddress}
            profileWalletAddress={profile?.walletAddress ?? undefined}
            kycCompleted={profile?.kycCompleted}
            kycLevel={profile?.kycLevel ?? undefined}
            onKycModalOpen={() => setKycModalOpen(true)}
          />

          <WalletSecurity />
        </div>

        {/* Panel Central - Información Personal */}
        <div className="lg:col-span-1 space-y-4">
          <ProfileHeader />

          <BasicInfo
            name={profile?.name ?? undefined}
            email={profile?.email ?? undefined}
            occupation={profile?.kycData?.occupation}
            taxId={profile?.kycData?.taxId}
          />

          {profile?.kycCompleted && (
            <KycInfo
              fullName={profile.kycData?.fullName}
              phoneNumber={profile.kycData?.phoneNumber}
              dateOfBirth={profile.kycData?.dateOfBirth}
              nationality={profile.kycData?.nationality}
            />
          )}

          <AddressInfo address={profile?.kycData?.address} />

          <AccountStatus
            role={profile?.role}
            connectionCount={profile?.connectionCount}
            kycCompleted={profile?.kycCompleted}
            lastConnectionAt={profile?.lastConnectionAt}
            projectCount={profile?.projectCount}
            hasPandorasKey={profile?.hasPandorasKey}
          />
        </div>

        {/* Panel Derecho - Gamificación */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-yellow-400" />
                Tu Desarrollo Gamificado
              </CardTitle>
              <CardDescription>
                Tu progreso en el sistema de recompensas de Pandora's
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estadísticas Principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-400">{gamification.totalPoints}</div>
                  <div className="text-xs text-gray-400">Tokens Totales</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-400">Nivel {gamification.currentLevel}</div>
                  <div className="text-xs text-gray-400">Tu Nivel</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                  <div className="text-2xl font-bold text-green-400">{gamification.achievements.length}</div>
                  <div className="text-xs text-gray-400">Logros</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-400">{gamification.levelProgress}%</div>
                  <div className="text-xs text-gray-400">Progreso</div>
                </div>
              </div>

              {/* Barra de Progreso de Nivel */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progreso al siguiente nivel</span>
                  <span className="text-gray-400">{gamification.levelProgress}%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-lime-400 to-emerald-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${gamification.levelProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Logros Recientes */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Logros Recientes</h4>
                {gamification.achievements.length > 0 ? (
                  <div className="space-y-2">
                    {gamification.achievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                        <div className="text-2xl">{(achievement as ExtendedUserAchievement).icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{(achievement as ExtendedUserAchievement).name}</div>
                          <div className="text-xs text-gray-400">{(achievement as ExtendedUserAchievement).description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-lime-400">+{(achievement as ExtendedUserAchievement).points} pts</div>
                          {achievement.completedAt && (
                            <div className="text-xs text-gray-500">
                              {new Date(achievement.completedAt).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {gamification.achievements.length > 3 && (
                      <Link href="/profile/achievements">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver todos los logros ({gamification.achievements.length})
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <BoltIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aún no tienes logros</p>
                    <p className="text-sm">¡Conecta tu wallet y comienza a ganar puntos!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compartir & Ganar + Referidos */}
          {walletAddress ? (
            <>
              <ReferralShareCard />
              <ReferralsCard />
            </>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="text-center py-8">
                <div className="text-cyan-400 text-lg mb-2">🔗 Compartir & Ganar</div>
                <p className="text-sm text-gray-400">Conecta tu wallet para compartir y gestionar referidos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de información KYC Básico */}
      <KycModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
      />
    </div>
  );
}
