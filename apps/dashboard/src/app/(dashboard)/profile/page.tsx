'use client';

import React, { useState } from 'react';
import { Button } from '@saasfly/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { ClipboardDocumentIcon, CheckIcon, WalletIcon, ShieldCheckIcon, ArrowTopRightOnSquareIcon, BoltIcon, KeyIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import Link from 'next/link';
import { useActiveAccount } from 'thirdweb/react';
// 🎮 IMPORTAR COMPONENTES Y HOOKS REALES DE GAMIFICACIÓN
import { useRealGamification } from '@/hooks/useRealGamification';
import { ReferralShareCard } from '@/components/ReferralShareCard';
import { ReferralsCard } from '../../../components/ReferralsCard';
import { AvatarEditor } from '@/components/AvatarEditor';

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
  const [copied, setCopied] = useState(false);

  // Use account from useActiveAccount hook instead of cookies
  const walletAddress = account?.address;

  // 🎮 CONTEXTO DE GAMIFICACIÓN REAL
  const gamification = useRealGamification(walletAddress);

  // Function to format wallet address with ellipsis
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Function to copy wallet address to clipboard
  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Wallet address copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Error al copiar');
    }
  };

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
          className="text-gray-400 hover:text-white transition-colors"
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
        {/* Avatar y Info Básica */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative">
                <AvatarEditor variant="desktop" />
              </div>
              {/* KYC Básico Button - Moved next to avatar and made smaller */}
              {!(profile?.kycCompleted && profile?.kycLevel === 'basic') && (
                <Link href="/profile/kyc">
                  <Button
                    size="sm"
                    className="bg-lime-500 hover:bg-lime-600 text-black font-medium px-3 py-1.5 shadow-lg text-sm whitespace-nowrap"
                  >
                    🔒 KYC Básico
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Dirección de Wallet</label>
              <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <WalletIcon className="w-4 h-4 text-lime-400" />
                    <span className="text-xs text-gray-300 font-medium">Ethereum Compatible</span>
                  </div>
                  <button
                    onClick={() => copyWalletAddress(walletAddress || profile?.walletAddress || '')}
                    className="flex items-center gap-1 text-gray-400 hover:text-lime-400 transition-colors p-1 rounded"
                    title="Copiar dirección completa"
                  >
                    {copied ? (
                      <CheckIcon className="w-4 h-4 text-green-400" />
                    ) : (
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="font-mono text-sm text-white mb-3">
                  {walletAddress ? formatWalletAddress(walletAddress) : profile?.walletAddress ? formatWalletAddress(profile.walletAddress) : ''}
                </div>

                {/* Información adicional de wallet */}
                <div className="space-y-2 pt-3 border-t border-zinc-700/30">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <ShieldCheckIcon className="w-3 h-3 text-blue-400" />
                    <span>Wallet no custodial - Tú controlas tus fondos</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <BoltIcon className="w-3 h-3 text-yellow-400" />
                    <span>Permite impulsar creaciones DeFi</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <ArrowTopRightOnSquareIcon className="w-3 h-3 text-purple-400" />
                    <span>Compatible con MetaMask, Trust Wallet, Coinbase Wallet</span>
                  </div>
                </div>
              </div>

              {/* Información sobre qué puedes hacer con tu wallet */}
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-3 border border-blue-700/20 mt-5">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-0.5 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium mb-1 text-gray-300 text-sm">💡 ¿Qué puedes hacer con tu wallet?</p>
                    <ul className="space-y-0.5 text-xs text-gray-400 ml-1">
                      <li>• Únete a comunidades verificadas</li>
                      <li>• Recibir recompensas por tu desempeño</li>
                      <li>• Transferir fondos de forma segura</li>
                      <li>• Interactuar con contratos inteligentes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Detallada - Primera sección */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Detalles de tu cuenta y estado de verificación
                  </CardDescription>
                </div>
                <Link href="/profile/edit">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-gray-400 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Editar Datos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información Básica */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Información Básica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Nombre</label>
                    <p className="text-white">{profile?.name ?? 'No registrado'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">Email</label>
                    <p className="text-white">{profile?.email ?? 'No registrado'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">Ocupación</label>
                    <p className="text-white">{profile?.kycData?.occupation ?? 'No especificada'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">ID Fiscal / RFC</label>
                    <p className="text-white font-mono">{profile?.kycData?.taxId ?? 'No registrado'}</p>
                  </div>
                </div>
              </div>

              {/* Información KYC */}
              {profile?.kycCompleted && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Información KYC</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Nombre Completo</label>
                      <p className="text-white">{profile?.kycData?.fullName ?? 'No registrado'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Teléfono</label>
                      <p className="text-white">{profile?.kycData?.phoneNumber ?? 'No registrado'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Fecha de Nacimiento</label>
                      <p className="text-white">{profile?.kycData?.dateOfBirth ?
                        new Date(profile.kycData.dateOfBirth).toLocaleDateString('es-ES') :
                        'No registrada'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Nacionalidad</label>
                      <p className="text-white">{profile?.kycData?.nationality ?? 'No registrada'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dirección */}
              {profile?.kycData?.address && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Dirección</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Dirección</label>
                      <p className="text-white">{profile.kycData.address.street ?? 'No registrada'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Ciudad</label>
                      <p className="text-white">{profile.kycData.address.city ?? 'No registrada'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">País</label>
                      <p className="text-white">{profile.kycData.address.country ?? 'No registrado'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Código Postal</label>
                      <p className="text-white font-mono">{profile.kycData.address.postalCode ?? 'No registrado'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Estado de Cuenta */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Estado de Cuenta</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Rol</label>
                    <p className="text-white capitalize">{profile?.role ?? 'pandorian'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">Connections</label>
                    <p className="text-white">{profile?.connectionCount ?? 1}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">Estado KYC</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        profile?.kycCompleted ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-white">
                        {profile?.kycCompleted ? 'Verificado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="w-5 h-5" />
                Seguridad de Wallet
              </CardTitle>
              <CardDescription>
                Información importante sobre tu wallet y recuperación de fondos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Critical Warning */}
              <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 rounded-lg p-4 border border-red-700/30">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-200 mb-1"> ¡Guarda tus claves privadas en lugar seguro!</p>
                    <p className="text-sm text-gray-300">
                      Si pierdes el acceso a tu wallet, solo podrás recuperarlo con tus claves privadas.
                      Guarda tu seed phrase/recovery kit en un lugar físico seguro y privado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recovery Options */}
              <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-gray-300">Opciones de Recuperación</h5>
                  <ShieldCheckIcon className="w-4 h-4 text-green-400" />
                </div>

                <div className="space-y-3">
                  {/* In-App Wallet Recovery */}
                  <div className="p-3 bg-zinc-700/30 rounded border border-zinc-600/50">
                    <div className="flex items-center gap-3 mb-2">
                      <WalletIcon className="w-4 h-4 text-lime-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-300">Wallet integrada</span>
                        <p className="text-xs text-gray-400">Via thirdweb recovery</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs bg-transparent border-zinc-600 hover:bg-zinc-700 text-gray-400"
                      onClick={() => {
                        toast.info('Funcionalidad de recovery kit próximamente disponible desde thirdweb');
                      }}
                      disabled={true}
                    >
                      Exportar Recovery Keys
                    </Button>
                  </div>

                  {/* External Wallet Message */}
                  <div className="p-3 bg-zinc-700/30 rounded border border-zinc-600/50">
                    <div className="flex items-center gap-3 mb-2">
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-300">Wallet externa</span>
                        <p className="text-xs text-gray-400">MetaMask, Trust Wallet, etc.</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs bg-transparent border-zinc-600 hover:bg-zinc-700 text-gray-400"
                      disabled={true}
                    >
                      En tu app
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-600/50">
                  <p className="text-xs text-gray-500">
                    <strong>Wallet integrada:</strong> Usa el recovery proporcionado por thirdweb<br/>
                    <strong>Wallet externa:</strong> Recupera desde tu aplicación oficial (MetaMask, etc.)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Tu actividad en las últimas conexiones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-gray-400">
                <p>Última conexión: {profile?.lastConnectionAt ?
                  new Date(profile.lastConnectionAt).toLocaleString('es-ES') :
                  'N/A'
                }</p>
                <p className="mt-2">Creaciones Aplicadas: {profile?.projectCount ?? 0}</p>
                <p>Tiene Pandora&apos;s Key: {profile?.hasPandorasKey ? '✅' : '❌'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gamificación y Logros */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-yellow-400" />
                Tu Desarrollo Gamificado
              </CardTitle>
              <CardDescription>
                Tu progreso en el sistema de recompensas de Pandora&apos;s
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
    </div>
  );
}
