'use client';

// Force dynamic rendering - this page uses auth
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveAccount, useDisconnect, useActiveWallet } from 'thirdweb/react';
import { useProfile } from '@/hooks/useProfile';
import Image from 'next/image';
import {
  UserIcon,
  ChartBarIcon,
  TrophyIcon,
  BookOpenIcon,
  FolderIcon,
  ArrowLeftOnRectangleIcon,
  CogIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export default function MobileProfilePage() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { profile, refreshProfile } = useProfile();

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const availableAvatars = [
    { path: '/images/avatars/onlybox2.png', name: 'OnlyBox' },
    { path: '/images/avatars/rasta.png', name: 'Rasta' },
  ];

  const updateAvatar = async (avatarPath: string) => {
    if (!account?.address) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/profile/update-avatar', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': account.address,
          'x-thirdweb-address': account.address,
          'x-user-address': account.address,
        },
        body: JSON.stringify({ image: avatarPath }),
      });

      if (response.ok) {
        await refreshProfile(); // Refresh profile data
        setShowAvatarModal(false);
        alert('Avatar actualizado correctamente!');
      } else {
        const error = await response.json() as { error?: string };
        alert(`Error: ${error?.error ?? 'Error actualizando avatar'}`);
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Error al actualizar el avatar');
    } finally {
      setUpdating(false);
    }
  };

  const uploadCustomAvatar = async (file: File) => {
    if (!account?.address) return;

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        headers: {
          'x-wallet-address': account.address,
          'x-thirdweb-address': account.address,
          'x-user-address': account.address,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json() as { optimization?: { originalSize: string; processedSize: string; compressionRatio: string } };
        await refreshProfile(); // Refresh profile data
        setShowAvatarModal(false);
        alert(`Avatar subido correctamente!\nOptimización: ${result.optimization?.compressionRatio ?? 'N/A'}`);
      } else {
        const error = await response.json() as { error?: string };
        alert(`Error: ${error?.error ?? 'Error subiendo avatar'}`);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error al subir el avatar');
    } finally {
      setUpdating(false);
    }
  };

  const profileLinks = [
    {
      href: '/profile',
      icon: <UserIcon className="w-5 h-5 text-gray-400" />,
      label: 'Perfil',
      description: 'Información personal',
    },
    {
      href: '/profile/dashboard',
      icon: <ChartBarIcon className="w-5 h-5 text-gray-400" />,
      label: 'Dashboard',
      description: 'Métricas e inversiones',
    },
    {
      href: '/profile/achievements',
      icon: <TrophyIcon className="w-5 h-5 text-gray-400" />,
      label: 'Mis Logros',
      description: 'Achievements y gamificación',
    },
    {
      href: '/education',
      icon: <BookOpenIcon className="w-5 h-5 text-lime-300" />,
      label: 'Aprende y Gana',
      description: 'Cursos Web3 con rewards (+puntos)',
    },
    {
      href: '/profile/projects',
      icon: <FolderIcon className="w-5 h-5 text-gray-400" />,
      label: 'Tus Creaciones',
      description: 'Gestionar creaciones',
    },
    {
      href: '/settings', // Placeholder por ahora
      icon: <CogIcon className="w-5 h-5 text-gray-400" />,
      label: 'Configuración',
      description: 'Ajustes de cuenta',
    },
  ];

  return (
    <div className="py-4 px-2 max-w-full space-y-6 pb-20 md:pb-6">
      {/* Facebook-style Header - Profile title left-aligned */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
      </div>

      {/* Facebook-style Profile Row - Avatar left, Wallet center-left, Edit right */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="relative inline-block">
            <Image
              src={profile?.image ?? '/images/avatars/onlybox2.png'}
              alt="Profile Avatar"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full border-2 border-lime-400"
            />
            <button
              onClick={() => setShowAvatarModal(true)}
              className="absolute -bottom-1 -right-1 bg-lime-400 hover:bg-lime-500 rounded-full p-1.5 border-2 border-gray-900 shadow-lg"
              aria-label="Editar avatar"
            >
              <PencilIcon className="w-3 h-3 text-gray-900" />
            </button>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-white font-medium text-sm">
            {account?.address ?
              `${account.address.slice(0, 12)}...${account.address.slice(-8)}` :
              'Conecta tu wallet'
            }
          </p>
        </div>
      </div>

      {/* Section Title */}
      <div className="py-2">
        <h2 className="text-2xl font-bold text-white mb-1">Acciones del Perfil</h2>
        <p className="text-gray-400 text-sm">Gestiona tu cuenta y accede a tus secciones favoritas</p>
      </div>

      {/* Profile Links Grid */}
      <div className="grid grid-cols-2 gap-3">
        {profileLinks.map((link) => (
          <div key={link.href} className="bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800/50">
            <Link
              href={link.href === '/settings' ? '#' : link.href} // Placeholder
              onClick={link.href === '/settings' ? (e) => e.preventDefault() : undefined}
              className="flex flex-col items-center gap-2 p-4 hover:bg-zinc-800/30 transition-colors text-center"
            >
              <div className="flex-shrink-0">
                {link.icon}
              </div>
              <div className="text-white text-sm font-medium">{link.label}</div>
              <div className="text-gray-400 text-xs">{link.description}</div>
            </Link>
          </div>
        ))}
      </div>

      {/* Wallet Actions */}
      {account && (
        <Card className="border-gray-900/50">
          <CardContent className="p-4">
            <Button
              onClick={() => wallet && disconnect(wallet)}
              variant="outline"
              className="w-full border-gray-700 hover:bg-gray-900/20 text-gray-400"
            >
              <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" />
              Desconectar Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Coming Soon - Wallet page */}
      <Card className="border-dashed border-gray-600">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">💰</span>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Wallet Management</h3>
          <p className="text-gray-400 text-sm mb-4">
            Vista detallada de balance, transacciones y gestión de fondos disponible próximamente.
          </p>
          <Button variant="outline" disabled className="w-full">
            Próximamente
          </Button>
        </CardContent>
      </Card>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personaliza tu Avatar</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAvatarModal(false)}
                  disabled={updating}
                >
                  <XMarkIcon className="w-5 h-5" />
                </Button>
              </div>
              <CardDescription>
                Elige un avatar prediseñado o sube tu propia imagen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custom Upload Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Sube tu propia imagen</h4>
                <div className="flex flex-col items-center space-y-3">
                  <button
                    className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-lime-400 hover:bg-lime-900/10 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('avatar-upload-input')?.click()}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-2">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm text-gray-400 mb-1">
                        Click para subir imagen
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, WebP hasta 5MB
                      </p>
                    </div>
                  </button>
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await uploadCustomAvatar(file);
                    }}
                  />
                </div>
              </div>

              {/* Preset Avatars */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Avatares prediseñados</h4>
                <div className="grid grid-cols-2 gap-3">
                  {availableAvatars.map((avatar) => (
                    <button
                      key={avatar.path}
                      onClick={() => updateAvatar(avatar.path)}
                      disabled={updating}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        profile?.image === avatar.path
                          ? 'border-lime-300 bg-lime-900/20'
                          : 'border-zinc-600 hover:border-lime-300 hover:bg-lime-900/10'
                      } ${updating ? 'opacity-50' : ''}`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Image
                          src={avatar.path}
                          alt={avatar.name}
                          width={50}
                          height={50}
                          className="w-10 h-10 rounded-full border border-zinc-600"
                        />
                        <span className="text-xs text-white font-medium">{avatar.name}</span>
                        {profile?.image === avatar.path && (
                          <CheckIcon className="w-4 h-4 text-lime-300" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {updating && (
                <div className="text-center text-sm text-gray-400 py-2">
                  <div className="animate-pulse">Procesando imagen...</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
