import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@saasfly/ui/card';
import { useActiveAccount } from 'thirdweb/react';
import { getContract, readContract } from 'thirdweb';
import type { ethereum } from 'thirdweb/chains';
import { client } from '@/lib/thirdweb-client';
import { motion } from 'framer-motion';
import { getContractAddress } from '@/lib/wallet-contracts';

// Tipos para el componente mobile-friendly

// Componente Mobile-Friendly para el árbol jerárquico

// Componente Mobile-Friendly para el árbol jerárquico
const MobileVaultTree: React.FC<{ nftBalance: number | null; isLoading: boolean; error: string | null }> = ({
  nftBalance,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span className="text-lg">🔄</span>
        </motion.div>
        <p className="text-gray-400 text-sm">Cargando colección NFT...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-lg">❌</span>
        </div>
        <p className="text-red-400 text-sm mb-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pandoras Key - Nivel Superior */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1 pt-6 mt-6 rounded-2xl shadow-xl"
      >
        <div className="bg-zinc-900 rounded-xl p-4 text-center">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-3xl mb-2"
          >
            🔑
          </motion.div>
          <h3 className="text-lg font-bold text-white mb-1">Pandoras Key</h3>
          <p className="text-xs text-purple-300 mb-2">Smart Wallet NFT</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
              Madre
            </span>
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
              W2E
            </span>
          </div>
          {nftBalance !== null && (
            <div className="text-sm text-green-400 font-medium">
              {nftBalance} NFT{nftBalance !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </motion.div>

      {/* Flecha hacia abajo */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-purple-400 text-xl"
        >
          ↓
        </motion.div>
      </div>

      {/* Accesos - Nivel Medio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { name: "Acceso Alpha", icon: "🚀", color: "from-blue-500 to-cyan-500", desc: "Acceso Premium" },
          { name: "Acceso Beta", icon: "⚡", color: "from-green-500 to-emerald-500", desc: "Acceso Avanzado" },
          { name: "Acceso Gamma", icon: "🔮", color: "from-purple-500 to-indigo-500", desc: "Acceso Elite" }
        ].map((acceso, index) => (
          <motion.div
            key={acceso.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
            className={`bg-gradient-to-br ${acceso.color} p-1 rounded-xl shadow-lg`}
          >
            <div className="bg-zinc-900 rounded-lg p-3 text-center">
              <div className="text-xl mb-1">{acceso.icon}</div>
              <h4 className="text-sm font-bold text-white mb-1">{acceso.name}</h4>
              <p className="text-xs text-gray-400">{acceso.desc}</p>
              <div className="mt-2 text-xs bg-zinc-800/50 text-gray-300 px-2 py-1 rounded">
                Próximamente
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Flecha hacia abajo */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-blue-400 text-xl"
        >
          ↓
        </motion.div>
      </div>

      {/* Artefactos - Nivel Inferior */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { name: "Artefacto A1", icon: "💎", color: "from-cyan-500 to-blue-500", type: "Alpha" },
          { name: "Artefacto A2", icon: "🔥", color: "from-red-500 to-orange-500", type: "Alpha" },
          { name: "Artefacto B1", icon: "🌟", color: "from-emerald-500 to-green-500", type: "Beta" },
          { name: "Artefacto B2", icon: "⚡", color: "from-yellow-500 to-amber-500", type: "Beta" },
          { name: "Artefacto G1", icon: "🎭", color: "from-indigo-500 to-purple-500", type: "Gamma" },
          { name: "Artefacto G2", icon: "👑", color: "from-pink-500 to-rose-500", type: "Gamma" }
        ].map((artefacto, index) => (
          <motion.div
            key={artefacto.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 2 + index * 0.05 }}
            className={`bg-gradient-to-br ${artefacto.color} p-0.5 rounded-lg shadow-md`}
          >
            <div className="bg-zinc-900 rounded-md p-2 text-center">
              <div className="text-lg mb-1">{artefacto.icon}</div>
              <h5 className="text-xs font-bold text-white mb-1">{artefacto.name}</h5>
              <p className="text-xs text-gray-400">{artefacto.type}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leyenda simplificada */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="mt-6 p-3 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-lg"
      >
        <p className="text-center text-xs text-gray-400">
          Los Artefactos se desbloquean al obtener los Accesos correspondientes dentro de tu Pandoras Key
        </p>
      </motion.div>
    </div>
  );
};

export function NFTGallery({ selectedChain }: { selectedChain: typeof ethereum }) {
  const account = useActiveAccount();
  const [nftBalance, setNftBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener dirección del contrato PandorasKey para la chain seleccionada
  const pandorasKeyAddress = getContractAddress('PANDORAS_KEY', selectedChain.id);

  // Cargar balance de NFTs cuando cambie la chain o la dirección del contrato
  useEffect(() => {
    const loadNFTBalance = async () => {
      if (!pandorasKeyAddress || pandorasKeyAddress === "0x..." || !account) {
        setNftBalance(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Crear contrato ERC721
        const contract = getContract({
          address: pandorasKeyAddress,
          chain: selectedChain,
          client: client,
        });

        // Leer balance del usuario (balanceOf para ERC721)
        const balance = await readContract({
          contract,
          method: "function balanceOf(address owner) view returns (uint256)",
          params: [account.address],
        });

        setNftBalance(Number(balance));
      } catch (err) {
        console.error('Error loading NFT balance:', err);
        setError('Error al cargar NFTs');
        setNftBalance(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadNFTBalance();
  }, [pandorasKeyAddress, selectedChain, account]);

  if (!account) return null;

  return (
    <Card>
      <CardContent>
        {pandorasKeyAddress && pandorasKeyAddress !== "0x..." ? (
          <MobileVaultTree nftBalance={nftBalance} isLoading={isLoading} error={error} />
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-lg">🌳</span>
            </div>
            <p className="text-gray-400 text-sm mb-2">
              Árbol de Activos Digitales
            </p>
            <p className="text-xs text-gray-500">
              Una vez desplegado el contrato Pandoras Key, podrás ver aquí tu árbol jerárquico de NFTs
            </p>
            <div className="mt-3 p-2 bg-zinc-800/50 rounded-lg">
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
