'use client';

// Force dynamic rendering - this page uses auth
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveAccount } from 'thirdweb/react';
import { ethereum } from 'thirdweb/chains';
import { WalletBalance, NetworkSelector } from '@/components/wallet';
import { SUPPORTED_NETWORKS } from '@/config/networks';
import { getContractAddress } from '~/lib/wallet-contracts';

// Componentes personalizados de wallet
function BalanceDashboard() {
  const account = useActiveAccount();
  const [selectedChain, setSelectedChain] = useState(ethereum);

  if (!account) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balances Multi-Chain</CardTitle>
        <CardDescription>
          Gestiona tus balances en diferentes redes blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NetworkSelector
          selectedChain={selectedChain}
          onChainChange={setSelectedChain}
          supportedNetworks={SUPPORTED_NETWORKS}
        />
        <WalletBalance
          selectedChain={selectedChain}
          accountAddress={account.address}
          supportedNetworks={SUPPORTED_NETWORKS}
        />
      </CardContent>
    </Card>
  );
}

function WalletInfoPanel() {
  const account = useActiveAccount();

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
          Detalles y dirección de tu wallet conectada
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

        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            💡 <strong>Recibe fondos:</strong> Comparte tu dirección pública para recibir tokens o NFTs
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function NFTGallery() {
  const account = useActiveAccount();
  const [selectedChain, setSelectedChain] = useState(ethereum);

  if (!account) return null;

  // Obtener dirección del contrato PandorasKey para la chain seleccionada
  const pandorasKeyAddress = getContractAddress('PANDORAS_KEY', selectedChain.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Colección NFT</CardTitle>
        <CardDescription>
          Tus Pandoras Keys y NFTs ganados por work-to-earn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de red para NFTs */}
        <NetworkSelector
          selectedChain={selectedChain}
          onChainChange={setSelectedChain}
          supportedNetworks={SUPPORTED_NETWORKS}
        />

        {pandorasKeyAddress && pandorasKeyAddress !== "0x..." ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <p className="text-gray-400 mb-4">
              Cargando colección NFT...
            </p>
            <p className="text-sm text-gray-500">
              Conectando con contrato Pandoras Key en {selectedChain.name}
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <p className="text-gray-400 mb-4">
              Próximamente: Vista completa de NFTs
            </p>
            <p className="text-sm text-gray-500">
              Una vez desplegado el contrato Pandoras Key, podrás ver aquí tus NFTs ganados por work-to-earn
            </p>
            <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-gray-400">
                Dirección del contrato: {pandorasKeyAddress ?? "No configurada"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SendReceiveInterface() {
  const account = useActiveAccount();

  if (!account) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar & Recibir</CardTitle>
        <CardDescription>
          Transfiere tokens y recibe fondos de otras wallets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💸</span>
          </div>
          <p className="text-gray-400 mb-4">
            Próximamente: Interface completa de envío y recepción
          </p>
          <p className="text-sm text-gray-500">
            Podrás enviar tokens a otras direcciones y generar códigos QR para recibir fondos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionHistory() {
  const account = useActiveAccount();

  if (!account) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Transacciones</CardTitle>
        <CardDescription>
          Todas tus transacciones en blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-400 mb-4">
            Próximamente: Historial completo de transacciones
          </p>
          <p className="text-sm text-gray-500">
            Visualiza todas tus transacciones, envíos, recepciones y actividad en contratos
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
    <div className="py-4 px-2 md:p-6 max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
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

          {/* Balance Dashboard */}
          <BalanceDashboard />

          {/* NFT Gallery */}
          <NFTGallery />

          {/* Send & Receive Interface */}
          <SendReceiveInterface />

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
