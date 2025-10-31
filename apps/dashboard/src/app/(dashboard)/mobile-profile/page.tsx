'use client';

// Force dynamic rendering - this page uses auth
export const dynamic = 'force-dynamic';

import React from 'react';
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
} from '@heroicons/react/24/outline';

export default function MobileProfilePage() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { profile } = useProfile();

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
      icon: <BookOpenIcon className="w-5 h-5 text-cyan-400" />,
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
    <div className="p-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="relative mb-4">
          <Image
            src={profile?.image ?? '/images/avatars/onlybox2.png'}
            alt="Profile Avatar"
            width={80}
            height={80}
            className="w-20 h-20 rounded-full border-2 border-lime-400 mx-auto"
          />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Perfil</h1>
        <p className="text-gray-400 text-sm">
          {account?.address ?
            `${account.address.slice(0, 8)}...${account.address.slice(-6)}` :
            'Conecta tu wallet'
          }
        </p>
      </div>

      {/* Profile Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones del Perfil</CardTitle>
          <CardDescription>
            Gestiona tu cuenta y accede a tus secciones favoritas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {profileLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href === '/settings' ? '#' : link.href} // Placeholder
              onClick={link.href === '/settings' ? (e) => e.preventDefault() : undefined}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex-shrink-0">
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium">{link.label}</div>
                <div className="text-gray-400 text-xs">{link.description}</div>
              </div>
              <div className="text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Wallet Actions */}
      {account && (
        <Card className="border-red-900/50">
          <CardContent className="p-4">
            <Button
              onClick={() => wallet && disconnect(wallet)}
              variant="outline"
              className="w-full border-red-600 hover:bg-red-900/20 text-red-400"
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

      {/* Bottom Spacer for Mobile Navigation */}
      <div className="md:hidden h-16" />
    </div>
  );
}
