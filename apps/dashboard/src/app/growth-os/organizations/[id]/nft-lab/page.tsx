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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-indigo-600" />
            NFT Lab & Smart Tokens
          </h1>
          <p className="text-slate-500 mt-1">
            Creación, minteo y emisión de certificados, membresías y pases VIP para {slugId.toUpperCase()}.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Nueva Colección
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {nftData.collections.map((col) => (
          <div key={col.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                  {col.type}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{col.name}</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">${col.symbol}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                {col.status}
              </span>
            </div>

            {/* Supply Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Minteados</span>
                <span className="font-semibold text-slate-800">{col.mintedSupply} / {col.totalSupply}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${(col.mintedSupply / col.totalSupply) * 100}%` }}
                />
              </div>
            </div>

            {/* Contract Info */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Cpu className="w-4 h-4 text-slate-400" />
                <span>Chain ID: {col.chainId} (Base)</span>
              </div>
              {col.contractAddress && (
                <span className="font-mono text-slate-400">
                  {col.contractAddress.slice(0, 6)}...{col.contractAddress.slice(-4)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Supported Chains */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold">Redes & Protocolos Soportados</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {nftData.supportedChains.map((chain) => (
            <div key={chain.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <p className="font-medium text-sm">{chain.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{chain.isTestnet ? 'Testnet' : 'Producción'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
