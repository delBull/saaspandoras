import React from 'react';
import { Card, CardContent } from '@saasfly/ui/card';
import { useActiveAccount } from 'thirdweb/react';
import { motion } from 'framer-motion';

// Asset type definition
interface Asset {
  type: 'access' | 'artifact' | 'utility';
  project: any;
  balance: string;
  name: string;
  tokenAddress: string;
}

const MobileVaultTree: React.FC<{ assets: Asset[], isLoading: boolean }> = ({
  assets,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader />
        <p className="text-gray-400 text-sm">Cargando colección...</p>
      </div>
    );
  }

  const accesses = assets.filter(a => a.type === 'access');
  const artifacts = assets.filter(a => a.type === 'artifact');

  return (
    <div className="space-y-6">
      {/* Pandoras Key - Root */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1 pt-6 mt-6 rounded-2xl shadow-xl"
      >
        <div className="bg-zinc-900 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">🔑</div>
          <h3 className="text-lg font-bold text-white mb-1">Pandoras Key</h3>
          <p className="text-xs text-purple-300 mb-2">My Digital Identity</p>
          <div className="text-sm text-green-400 font-medium">
            {assets.length} Activos Vinculados
          </div>
        </div>
      </motion.div>

      {/* Connection Line */}
      <div className="flex justify-center text-purple-400 text-xl">↓</div>

      {/* Accesses Layer */}
      {accesses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {accesses.map((asset, i) => (
            <motion.div
              key={asset.tokenAddress}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-cyan-500 p-0.5 rounded-xl"
            >
              <div className="bg-zinc-900 rounded-lg p-3 text-center h-full flex flex-col justify-center">
                <div className="text-xl mb-1">🚀</div>
                <h4 className="text-sm font-bold text-white leading-tight">{asset.name}</h4>
                <p className="text-[10px] text-gray-400 mt-1 truncate">{asset.project.slug}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center text-zinc-600 text-sm py-2 bg-zinc-900/30 rounded-lg">No tienes Access Cards.</div>
      )}

      {/* Connection Line */}
      <div className="flex justify-center text-blue-400 text-xl">↓</div>

      {/* Artifacts Layer */}
      {artifacts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {artifacts.map((asset, i) => (
            <motion.div
              key={asset.tokenAddress}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-red-500 to-orange-500 p-0.5 rounded-lg"
            >
              <div className="bg-zinc-900 rounded-md p-2 text-center h-full">
                <div className="text-lg mb-1">💎</div>
                <h5 className="text-xs font-bold text-white">{asset.name}</h5>
                <p className="text-[10px] text-gray-400">Balance: {asset.balance}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center text-zinc-600 text-sm py-2 bg-zinc-900/30 rounded-lg">No tienes Artefactos.</div>
      )}
    </div>
  );
};

export function NFTGallery({ assets = [], isLoading = false }: { assets?: Asset[], isLoading?: boolean, selectedChain?: any }) {
  const account = useActiveAccount();

  if (!account) return null;

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardContent>
        <MobileVaultTree assets={assets} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}

function Loader() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"
    />
  );
}