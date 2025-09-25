'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@saasfly/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import type { UserData } from '@/types/admin';
import Image from 'next/image';

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<{
    walletAddress?: string;
    name?: string;
    email?: string;
    image?: string;
  } | null>(null);

  useEffect(() => {
    // Get user session from cookies (wallet-address)
    const getSession = () => {
      try {
        const walletAddress = document.cookie
          .split('; ')
          .find(row => row.startsWith('wallet-address='))
          ?.split('=')[1];

        if (walletAddress) {
          setSessionUser({
            walletAddress: walletAddress,
            name: undefined,
            email: undefined,
            image: undefined,
          });
        }
      } catch (error) {
        console.error('Error getting session from cookies:', error);
      } finally {
        setSessionLoading(false);
      }
    };

    getSession();
  }, []);

  useEffect(() => {
    if (sessionUser?.walletAddress) {
      // Fetch user profile data from database
      fetch('/api/admin/users')
        .then(res => res.json())
        .then((users: UserData[]) => {
          const currentUser = users.find((u: UserData) =>
            u.walletAddress.toLowerCase() === sessionUser.walletAddress?.toLowerCase()
          );
          setUserProfile(currentUser ?? null);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching user profile:', err);
          setLoading(false);
        });
    } else if (!sessionLoading) {
      setLoading(false);
    }
  }, [sessionUser, sessionLoading]);

  if (sessionLoading || loading) {
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

  if (!sessionUser) {
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
              <div className="relative">
                <Image
                  src={userProfile?.image ?? sessionUser.image ?? '/images/avatars/rasta.png'}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full border-2 border-lime-400"
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${
                  userProfile?.kycLevel === 'advanced' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {userProfile?.name ?? sessionUser.name ?? 'Usuario'}
                </div>
                <div className="text-sm text-gray-400">
                  Nivel {userProfile?.kycLevel === 'advanced' ? 'Avanzado' : 'Básico'}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-400">Wallet Address</label>
              <div className="font-mono text-sm text-white bg-zinc-800 rounded p-2 mt-1 overflow-hidden">
                {sessionUser.walletAddress}
              </div>
            </div>

            {userProfile?.kycLevel === 'basic' && (
              <Button
                className="w-full bg-lime-500 hover:bg-lime-600 text-black font-bold px-4 py-2 shadow-lg flex-shrink-0 text-base whitespace-nowrap"
                onClick={() => window.location.href = '/profile/kyc'}
              >
                🔒 Completa KYC Avanzado
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Información Detallada */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Detalles de tu cuenta y estado de verificación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <p className="text-white">{userProfile?.email ?? sessionUser.email ?? 'No registrado'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">Rol</label>
                  <p className="text-white capitalize">{userProfile?.role ?? 'pandorian'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">Connections</label>
                  <p className="text-white">{userProfile?.connectionCount ?? 1}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">Estado KYC</label>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      userProfile?.kycCompleted ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-white">
                      {userProfile?.kycCompleted ? 'Verificado' : 'Pendiente'}
                    </span>
                  </div>
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
                <p>Última conexión: {userProfile?.lastConnectionAt ?
                  new Date(userProfile.lastConnectionAt).toLocaleString('es-ES') :
                  'N/A'
                }</p>
                <p className="mt-2">Proyecto aplicado: {userProfile?.projectCount ?? 0}</p>
                <p>Tiene Pandora&apos;s Key: {userProfile?.hasPandorasKey ? '✅' : '❌'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
