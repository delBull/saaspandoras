'use client';

// Force dynamic rendering - this page uses auth
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveAccount, useWalletBalance } from 'thirdweb/react';
import { ethereum } from 'thirdweb/chains';
import { client } from '@/lib/thirdweb-client';

// Mostrar info de wallet, balance y recibir fondos
function WalletInfoPanel() {
  const account = useActiveAccount();
  const { data: balance } = useWalletBalance({
    client,
    chain: ethereum,
    address: account?.address,
  });

  if (!account) return null;

  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      alert('Dirección copiada al portapapeles');
    } catch (err) {
      alert('Error al copiar la dirección');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Wallet</CardTitle>
        <CardDescription>
          Detalles y balance de tu wallet conectada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-400">Dirección:</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-mono text-sm text-white bg-zinc-800 p-2 rounded flex-1 truncate">
              {account.address}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyWalletAddress(account.address)}
              className="text-gray-400 hover:text-white"
            >
              Copiar
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-400">Balance ETH:</p>
          <p className="text-lg font-semibold text-green-400">
            {balance ? `${balance.displayValue} ${balance.symbol}` : "Cargando..."}
          </p>
        </div>

        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            💡 <strong>Recibe fondos:</strong> Comparte tu dirección pública para recibir tokens o NFTs
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// App principal: funcional wallet page
export default function WalletPage() {
  const account = useActiveAccount();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💰</span>
        </div>
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

          {/* Coming Soon Features */}
          <Card className="border-dashed border-gray-600">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🚀</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Funcionalidades Próximas
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Estamos trabajando en funcionalidades avanzadas como envío de tokens, vista de NFTs,
                y gestión de transacciones. Estas estarán disponibles pronto.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <h4 className="text-white font-medium mb-2">📤 Transferencias</h4>
                  <p className="text-gray-400 text-sm">Envío de ETH y tokens ERC20</p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">🎨 NFTs</h4>
                  <p className="text-gray-400 text-sm">Vista de colecciones y NFT wallet</p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">📊 Historial</h4>
                  <p className="text-gray-400 text-sm">Historial completo de transacciones</p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">🔒 Seguridad</h4>
                  <p className="text-gray-400 text-sm">Herramientas avanzadas de seguridad</p>
                </div>
              </div>
            </CardContent>
          </Card>

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

      {/* Bottom Spacer for Mobile Navigation */}
      <div className="md:hidden h-16" />
    </div>
  );
}
