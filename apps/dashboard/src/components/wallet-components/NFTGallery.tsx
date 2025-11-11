import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { useActiveAccount } from 'thirdweb/react';
import { ethereum } from 'thirdweb/chains';
import { NetworkSelector } from '@/components/wallet';
import { SUPPORTED_NETWORKS } from '@/config/networks';
import { getContractAddress } from '~/lib/wallet-contracts';

export function NFTGallery() {
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
