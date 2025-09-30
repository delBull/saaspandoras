'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@saasfly/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { ClipboardDocumentIcon, CheckIcon, WalletIcon, ShieldCheckIcon, ArrowTopRightOnSquareIcon, BoltIcon, KeyIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import Link from 'next/link';
import Image from 'next/image';

export default function ProfilePage() {
  const { profile, isLoading, isError } = useProfile();
  const [sessionUser, setSessionUser] = useState<{walletAddress?: string} | null>(null);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    // Get user session from cookies
    const getSession = () => {
      try {
        const walletAddress = document.cookie
          .split('; ')
          .find(row => row.startsWith('wallet-address='))
          ?.split('=')[1];

        if (walletAddress) {
          setSessionUser({ walletAddress });
        }
      } catch (error) {
        console.error('Error getting session from cookies:', error);
      }
    };

    getSession();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-700 rounded mb-4 w-64"></div>
          <div className="space-y-4">
            <div className="h-32 bg-zinc-700 rounded"></div>
            <div className="h-48 bg-zinc-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !sessionUser || !profile) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>Necesitas estar conectado para ver tu perfil.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Perfil de Usuario</h1>
          <p className="text-gray-400">Gestiona tu información personal y configuraciones de cuenta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar y Info Básica */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="relative mb-5">
                <Image
                  src={profile?.image ?? '/images/avatars/rasta.png'}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full border-2 border-lime-400"
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${
                  (profile?.kycCompleted && profile?.kycLevel === 'basic') ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {profile?.name ?? 'Usuario'}
                </div>
                <div className="text-sm text-gray-400">
                  Nivel {(profile?.kycCompleted && profile?.kycLevel === 'basic') ? 'Básico' : 'N/A'}
                </div>
              </div>
            </CardTitle>
            {/* KYC Básico Button */}
            {!(profile?.kycCompleted && profile?.kycLevel === 'basic') && (
              <Link href="/profile/kyc">
                <Button
                  className="w-full bg-lime-500 hover:bg-lime-600 text-black font-medium px-4 py-2 shadow-lg flex-shrink-0 text-base whitespace-nowrap"
                >
                  🔒 Completa KYC Básico
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Dirección de Wallet</label>
              <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <WalletIcon className="w-4 h-4 text-lime-400" />
                    <span className="text-xs text-gray-300 font-medium">Ethereum</span>
                  </div>
                  <button
                    onClick={() => copyWalletAddress(sessionUser.walletAddress || '')}
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
                  {sessionUser.walletAddress ? formatWalletAddress(sessionUser.walletAddress) : ''}
                </div>

                {/* Información adicional de wallet */}
                <div className="space-y-2 pt-3 border-t border-zinc-700/30">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <ShieldCheckIcon className="w-3 h-3 text-blue-400" />
                    <span>Wallet no custodial - Tú controlas tus fondos</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <BoltIcon className="w-3 h-3 text-yellow-400" />
                    <span>Permite inversiones seguras en proyectos DeFi</span>
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
                      <li>• Invertir en proyectos verificados</li>
                      <li>• Recibir pagos de inversiones</li>
                      <li>• Transferir fondos de forma segura</li>
                      <li>• Interactuar con contratos inteligentes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Detallada */}
        <div className="lg:col-span-2 space-y-6">
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
                  <div className="flex items-center justify-between p-3 bg-zinc-700/30 rounded border border-zinc-600/50">
                    <div className="flex items-center gap-3">
                      <WalletIcon className="w-4 h-4 text-lime-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-300">Wallet integrada</span>
                        <p className="text-xs text-gray-400">Via thirdweb recovery</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-transparent border-zinc-600 hover:bg-zinc-700 text-gray-400"
                      onClick={() => {
                        toast.info('Funcionalidad de recovery kit próximamente disponible desde thirdweb');
                      }}
                      disabled={true}
                    >
                      Exportar Recovery Keys
                    </Button>
                  </div>

                  {/* External Wallet Message */}
                  <div className="flex items-center justify-between p-3 bg-zinc-700/30 rounded border border-zinc-600/50">
                    <div className="flex items-center gap-3">
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-300">Wallet externa</span>
                        <p className="text-xs text-gray-400">MetaMask, Trust Wallet, etc.</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-transparent border-zinc-600 hover:bg-zinc-700 text-gray-400"
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
                <p className="mt-2">Proyecto aplicado: {profile?.projectCount ?? 0}</p>
                <p>Tiene Pandora&apos;s Key: {profile?.hasPandorasKey ? '✅' : '❌'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
