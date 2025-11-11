'use client';

// Force dynamic rendering - this page uses auth
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveAccount } from 'thirdweb/react';
import { ethereum } from 'thirdweb/chains';
import {
  BalanceDashboard,
  WalletInfoPanel,
  NFTGallery,
  SendReceiveInterface,
  TransactionHistory
} from '@/components/wallet-components';

// App principal: funcional wallet page
export default function WalletPage() {
  const account = useActiveAccount();

  return (
    <div className="py-4 px-2 md:p-6 max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Wallet Management
        </h1>
        <p className="text-gray-400">
          Gestiona tu wallet, balances y transacciones
        </p>
      </div>

      {account ? (
        <>
          {/* Wallet Info */}
          <WalletInfoPanel />

          {/* Balance Dashboard */}
          <BalanceDashboard />

          {/* NFT Gallery */}
          <NFTGallery selectedChain={ethereum} />

          {/* Send & Receive Interface */}
                <SendReceiveInterface selectedChain={ethereum} />

          {/* Transaction History */}
          <TransactionHistory />

          {/* Navigation Links */}
          <Card>
            <CardHeader>
              <CardTitle>Explorar Más</CardTitle>
              <CardDescription>
                Otras secciones del dashboard que podrían interesarte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/profile" className="p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <h4 className="text-white font-medium">Perfil</h4>
                      <p className="text-gray-400 text-sm">Configuración personal</p>
                    </div>
                  </div>
                </Link>

                <Link href="/profile/dashboard" className="p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <h4 className="text-white font-medium">Dashboard</h4>
                      <p className="text-gray-400 text-sm">Métricas e inversiones</p>
                    </div>
                  </div>
                </Link>

                <Link href="/profile/achievements" className="p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <h4 className="text-white font-medium">Logros</h4>
                      <p className="text-gray-400 text-sm">Sistema de gamificación</p>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        // Wallet not connected - show connect message
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔗</span>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              Conecta tu Wallet
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Conecta tu wallet para acceder a todas las funciones avanzadas de gestión de fondos.
            </p>
            <Link href="/applicants">
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                Conectar Wallet
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
