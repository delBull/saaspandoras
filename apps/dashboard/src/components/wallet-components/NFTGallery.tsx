import React from 'react';
import { Card, CardContent } from '@saasfly/ui/card';
import { useActiveAccount } from 'thirdweb/react';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

  // Find the root key
  const hasKey = assets.some(a => a.project?.slug === 'apply-pass');
  const keyAsset = assets.find(a => a.project?.slug === 'apply-pass');

  // Group assets by project, excluding the root Apply Pass (Pandoras Key)
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
    <div className="space-y-0 relative px-2 pb-12">
      {/* Pandoras Key - Root Node */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-20"
        >
          <div className={`p-0.5 rounded-full shadow-lg transition-all duration-700 ${hasKey
            ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 shadow-purple-500/40'
            : 'bg-zinc-800 shadow-black/20 grayscale'
            }`}>
            <div className="bg-zinc-950 rounded-full w-32 h-32 flex flex-col items-center justify-center border border-white/10 relative overflow-hidden">
              <span className="text-5xl mb-1 drop-shadow-lg">🔑</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${hasKey ? 'text-purple-400' : 'text-zinc-600'}`}>
                {hasKey ? 'Pandoras Key' : 'Bloqueada'}
              </span>

              {hasKey && (
                <div className="absolute bottom-2 bg-green-500/20 text-green-400 text-[9px] px-2 py-0.5 rounded-full border border-green-500/30 font-bold uppercase tracking-tighter">
                  Activa
                </div>
              )}
            </div>
          </div>
          {hasKey && <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-pulse -z-10" />}
        </motion.div>

        {/* Main Trunk Line */}
        {projectGroups.length > 0 && (
          <div className={`h-12 w-px bg-gradient-to-b from-purple-500 to-zinc-800 ${!hasKey && 'opacity-20'}`} />
        )}
      </div>

      {projectGroups.length > 0 ? (
        <div className="space-y-0 relative">
          {projectGroups.map((group, idx) => (
            <div key={group.project?.slug || idx} className="relative pt-8">
              {/* Connecting line from trunk to this project */}
              <div className="absolute left-1/2 top-0 h-8 w-px bg-zinc-800 -translate-x-1/2" />

              <div className="flex flex-col items-center">
                {/* 1. Protocol Access Pass (Parent) */}
                <div className="relative z-10 w-full max-w-[220px]">
                  {group.access ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-blue-600/50 to-cyan-600/50 p-px rounded-2xl shadow-xl shadow-blue-500/5 transition-transform hover:scale-[1.02]"
                    >
                      <div className="bg-zinc-950 rounded-[15px] p-5 text-center border border-white/10">
                        <div className="text-3xl mb-2">🎫</div>
                        <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1 opacity-80">Protocol Access</div>
                        <h5 className="text-[13px] font-bold text-white leading-tight mb-1">{group.access.name}</h5>
                        <div className="text-[9px] text-zinc-500 font-mono tracking-tighter truncate opacity-60">
                          {group.project?.title || 'Protocolo'}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-zinc-900/40 border border-dashed border-zinc-700/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
                      <div className="text-zinc-700 text-xl mb-1 opacity-20">🎫</div>
                      <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Sin Licencia</p>
                    </div>
                  )}
                </div>

                {/* 2. Branch Line to Artifacts */}
                <div className={`h-8 w-px bg-gradient-to-b from-zinc-700 to-zinc-800 ${!group.access && 'opacity-30'}`} />

                {/* 3. Artifacts Container (Children) */}
                <div className="w-full max-w-sm px-4">
                  {group.artifacts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 relative">
                      {/* Decorative bracket lines for hierarchy if multiple artifacts */}
                      {group.artifacts.length > 1 && (
                        <div className="absolute -top-4 left-1/4 right-1/4 h-4 border-x border-t border-zinc-800 rounded-t-xl" />
                      )}

                      {group.artifacts.map((art, aIdx) => (
                        <motion.div
                          key={art.tokenAddress + aIdx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: aIdx * 0.05 }}
                          className="group relative"
                        >
                          <div className="bg-gradient-to-br from-orange-600/30 to-red-600/30 p-px rounded-xl shadow-lg border border-white/5 transition-all hover:border-orange-500/50">
                            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-[11px] p-3 text-center h-full flex flex-col items-center justify-center">
                              <div className="text-xl mb-1 group-hover:animate-bounce">💎</div>
                              <h5 className="text-[11px] font-bold text-zinc-200 truncate w-full">{art.name}</h5>
                              <div className="mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-[8px] text-zinc-500 font-mono tracking-tighter">ARTIFACT</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-zinc-900/10 border border-zinc-800/30 rounded-xl p-3 text-center">
                      <p className="text-[9px] text-zinc-700 font-medium uppercase tracking-[0.15em]">Sin Artefactos</p>
                    </div>
                  )}
                </div>

                {/* Vertical Spacer for next project tree */}
                {idx < projectGroups.length - 1 && (
                  <div className="h-12 w-px bg-zinc-800 mt-4 opacity-40" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6 bg-zinc-900/20 rounded-[40px] border border-dashed border-zinc-800/50 max-w-sm mx-auto mt-8">
          <div className="text-5xl mb-6 opacity-10">{hasKey ? '✨' : '🛡️'}</div>
          <p className="text-zinc-500 text-base font-bold mb-2 tracking-tight">
            {hasKey ? 'Tu Bóveda está lista' : 'Tu Bóveda está protegida'}
          </p>
          <p className="text-zinc-600 text-xs leading-relaxed max-w-[200px] mx-auto font-medium">
            {hasKey 
              ? 'Aún no has adquirido artefactos de protocolos. Explora los proyectos disponibles para comenzar.'
              : <>No se han detectado activos en tu dirección. Adquiere tu <span className="text-zinc-400">Pandora\'s Key</span> para comenzar a desplegar protocolos.</>
            }
          </p>
          {hasKey && (
            <Link href="/projects" className="mt-6 inline-block text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-widest border border-orange-500/20 px-4 py-2 rounded-full bg-orange-500/5 transition-all">
              Explorar Protocolos
            </Link>
          )}
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