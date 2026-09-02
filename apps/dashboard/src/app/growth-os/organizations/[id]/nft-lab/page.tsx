import { DashApi } from '@/lib/dash-api';
import { Sparkles, Layers, ShieldCheck, Plus, ExternalLink, Cpu } from 'lucide-react';

export default async function NftLabPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams.id;
  const orgId = `org_${slugId}`;

  let nftData = {
    collections: [] as any[],
    supportedChains: [] as any[],
  };

  try {
    nftData = await DashApi.growth.getNftLab(orgId);
  } catch (err) {
    console.warn('[NftLabPage] Error fetching NFT lab:', err);
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <Sparkles className="w-7 h-7 text-indigo-400" />
            NFT Lab & Smart Tokens
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Creación, minteo y emisión de certificados, membresías y pases VIP para {slugId.toUpperCase()}.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-lg shadow-indigo-600/20">
          <Plus className="w-4 h-4" />
          Nueva Colección
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {nftData.collections.map((col) => (
          <div key={col.id} className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {col.type}
                </span>
                <h3 className="text-lg font-bold text-white mt-2">{col.name}</h3>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">${col.symbol}</p>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {col.status}
              </span>
            </div>

            {/* Supply Progress */}
            <div className="space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Minteados</span>
                <span className="font-semibold text-white">{col.mintedSupply} / {col.totalSupply}</span>
              </div>
              <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all"
                  style={{ width: `${(col.mintedSupply / (col.totalSupply || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Contract Info */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-400">
                <Cpu className="w-4 h-4 text-zinc-500" />
                <span>Chain ID: {col.chainId} (Base)</span>
              </div>
              {col.contractAddress && (
                <span className="text-zinc-400">
                  {col.contractAddress.slice(0, 6)}...{col.contractAddress.slice(-4)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Supported Chains */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Redes & Protocolos Soportados</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {nftData.supportedChains.map((chain) => (
            <div key={chain.id} className="p-3.5 bg-white/[0.02] rounded-xl border border-white/10">
              <p className="font-semibold text-white text-sm">{chain.name}</p>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{chain.isTestnet ? 'Testnet' : 'Producción'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
