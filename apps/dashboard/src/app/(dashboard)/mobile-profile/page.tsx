'use client';

// Force dynamic rendering - this page uses auth
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@saasfly/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveAccount, useDisconnect, useActiveWallet } from 'thirdweb/react';
import {
  UserIcon,
  ChartBarIcon,
  TrophyIcon,
  BookOpenIcon,
  FolderIcon,
  ArrowLeftOnRectangleIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { AvatarEditor } from '@/components/AvatarEditor';
import { ConnectWalletButton } from '@/components/wallet';

export default function MobileProfilePage() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

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
      label: 'Tus Protocolos',
      description: 'Gestionar protocoloes',
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
        <AvatarEditor variant="mobile" />

        <div className="flex-1">
          <ConnectWalletButton
            className="w-full text-left"
          />
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
    </div>
  );
}
