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

  // Group assets by project, excluding the root Apply Pass (Pandoras Key)
  const hasKey = assets.some(a => a.project?.slug === 'apply-pass');
  const filteredAssets = assets.filter(a => a.project?.slug !== 'apply-pass');

  const projectsMap = new Map<string, { project: any, access: Asset | null, artifacts: Asset[] }>();

  filteredAssets.forEach(asset => {
    const slug = asset.project?.slug || 'other';
    if (!projectsMap.has(slug)) {
      projectsMap.set(slug, { project: asset.project, access: null, artifacts: [] });
    }
    const group = projectsMap.get(slug)!;
    if (asset.type === 'access') {
      group.access = asset;
    } else {
      group.artifacts.push(asset);
    }
  });

  const projectGroups = Array.from(projectsMap.values());

  return (
    <div className="space-y-8 relative px-2">
      {/* Pandoras Key - Root Node */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10"
        >
          <div className={`p-0.5 rounded-full shadow-lg transition-all duration-700 ${hasKey
            ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 shadow-purple-500/40'
            : 'bg-zinc-800 shadow-black/20 grayscale'
            }`}>
            <div className="bg-zinc-950 rounded-full w-28 h-28 flex flex-col items-center justify-center border border-white/10 relative overflow-hidden">
              <span className="text-4xl mb-1 drop-shadow-lg">🔑</span>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${hasKey ? 'text-purple-400' : 'text-zinc-600'}`}>
                {hasKey ? 'Pandoras Key' : 'Bloqueada'}
              </span>

              {hasKey && (
                <div className="absolute bottom-1 bg-green-500/20 text-green-400 text-[8px] px-2 py-0.5 rounded-full border border-green-500/30 font-bold uppercase tracking-tighter">
                  Activa
                </div>
              )}
            </div>
          </div>
          {/* Pulse effect if has key */}
          {hasKey && <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping -z-10" />}
        </motion.div>

        <div className={`h-10 w-px bg-gradient-to-b from-purple-500 to-transparent ${!hasKey && 'opacity-20'}`} />
      </div>

      {projectGroups.length > 0 ? (
        <div className="space-y-12">
          {projectGroups.map((group, idx) => (
            <div key={group.project?.slug || idx} className="relative">
              <div className="flex flex-col items-center gap-4">
                {/* Protocol Header */}
                <div className="text-center">
                  <h4 className="text-[10px] font-black text-white/90 uppercase tracking-[0.3em] bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                    {group.project?.title || 'Otros Activos'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
                  {/* Access Node */}
                  <div className="flex flex-col items-center h-full">
                    {group.access ? (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="bg-gradient-to-br from-blue-600 to-cyan-600 p-px rounded-xl shadow-xl shadow-blue-500/5 w-full aspect-[4/3] max-w-[180px]"
                      >
                        <div className="bg-zinc-950 rounded-[11px] p-4 text-center h-full flex flex-col justify-center border border-white/5">
                          <div className="text-2xl mb-1">🎫</div>
                          <div className="text-[8px] text-blue-400 font-black uppercase tracking-widest mb-1 opacity-80">Access Card</div>
                          <h5 className="text-[11px] font-bold text-white leading-tight line-clamp-2">{group.access.name}</h5>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-zinc-900/40 border border-dashed border-zinc-700/50 rounded-xl p-4 text-center w-full aspect-[4/3] max-w-[180px] flex items-center justify-center">
                        <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest">Sin Licencia</p>
                      </div>
                    )}
                  </div>

                  {/* Artifacts Grid */}
                  <div className="flex flex-col justify-center h-full">
                    {group.artifacts.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {group.artifacts.map((art, aIdx) => (
                          <motion.div
                            key={art.tokenAddress}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: aIdx * 0.05 }}
                            className="bg-gradient-to-br from-orange-600 to-red-600 p-px rounded-lg shadow-lg shadow-orange-500/5"
                          >
                            <div className="bg-zinc-950 rounded-[7px] p-2.5 text-center h-full border border-white/5 flex flex-col justify-center">
                              <div className="text-base mb-0.5">💎</div>
                              <h5 className="text-[10px] font-bold text-white truncate px-1">{art.name}</h5>
                              <div className="h-[2px] w-4 bg-orange-500/50 mx-auto mt-1 rounded-full" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-lg p-4 text-center flex flex-col items-center justify-center aspect-[4/3]">
                        <div className="text-zinc-700 text-lg mb-1 opacity-30">🛡️</div>
                        <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest leading-relaxed">Sin Artefactos<br />Vinculados</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Separator Line for next project */}
                {idx < projectGroups.length - 1 && (
                  <div className="w-1/3 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-6 opacity-30" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800/50 max-w-md mx-auto">
          <div className="text-4xl mb-4 opacity-20">📂</div>
          <p className="text-zinc-500 text-sm font-medium mb-1 tracking-tight">Tu bóveda está vacía</p>
          <p className="text-zinc-600 text-xs tracking-tight">Adquiere accesos o artefactos para verlos aquí jerárquicamente.</p>
        </div>
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