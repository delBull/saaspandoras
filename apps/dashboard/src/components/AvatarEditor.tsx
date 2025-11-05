'use client';

import React, { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useProfile } from '@/hooks/useProfile';
import Image from 'next/image';
import {
  UserIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface AvatarEditorProps {
  variant?: 'mobile' | 'desktop';
  onClose?: () => void;
}

export function AvatarEditor({ variant = 'desktop', onClose }: AvatarEditorProps) {
  const account = useActiveAccount();
  const { profile, refreshProfile } = useProfile();
  const [showModal, setShowModal] = useState(false);
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
        await refreshProfile();
        setShowModal(false);
        toast.success('Avatar agregado correctamente');
        onClose?.();
      } else {
        const error = await response.json() as { error?: string };
        toast.error(`Error: ${error?.error ?? 'Error actualizando avatar'}`);
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Error al actualizar el avatar');
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
          // Don't set Content-Type for FormData - browser sets it automatically
        },
        body: formData,
      });

      if (response.ok) {
        await refreshProfile();
        setShowModal(false);
        toast.success('Avatar agregado correctamente');
        onClose?.();
      } else {
        const error = await response.json() as { error?: string };
        toast.error(`Error: ${error?.error ?? 'Error subiendo avatar'}`);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error al subir el avatar');
    } finally {
      setUpdating(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadCustomAvatar(file);
    }
    // Reset input
    e.target.value = '';
  };

  if (variant === 'mobile') {
    return (
      <>
        {/* Avatar Display */}
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
              onClick={() => setShowModal(true)}
              className="absolute -bottom-1 -right-1 bg-lime-400 hover:bg-lime-500 rounded-full p-1.5 border-2 border-gray-900 shadow-lg"
              aria-label="Editar avatar"
            >
              <PencilIcon className="w-3 h-3 text-gray-900" />
            </button>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Personaliza tu Avatar</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                    disabled={updating}
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-white" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Elige un avatar prediseñado o sube tu propia imagen
                </p>
              </div>

              <div className="p-4 space-y-6">
                {/* Custom Upload Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white">Sube tu propia imagen</h4>
                  <div className="flex flex-col items-center space-y-3">
                    <button
                      className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-lime-400 hover:bg-lime-900/10 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('avatar-upload-input-mobile')?.click()}
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
                      id="avatar-upload-input-mobile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileSelect}
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
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop variant
  return (
    <>
      {/* Avatar Display */}
      <div className="relative mb-5">
        <Image
          src={profile?.image ?? '/images/avatars/onlybox2.png'}
          alt="Profile"
          width={64}
          height={64}
          className="w-16 h-16 rounded-full border-2 border-lime-400"
        />
        <button
          onClick={() => setShowModal(true)}
          className="absolute -bottom-1 -right-1 bg-lime-400 hover:bg-lime-500 rounded-full p-1.5 border-2 border-zinc-900 shadow-lg"
          aria-label="Editar avatar"
        >
          <PencilIcon className="w-3 h-3 text-zinc-900" />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Personaliza tu Avatar</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                  disabled={updating}
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Elige un avatar prediseñado o sube tu propia imagen
              </p>
            </div>

            <div className="p-4 space-y-6">
              {/* Custom Upload Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Sube tu propia imagen</h4>
                <div className="flex flex-col items-center space-y-3">
                  <button
                    className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-lime-400 hover:bg-lime-900/10 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('avatar-upload-input-desktop')?.click()}
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
                    id="avatar-upload-input-desktop"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
