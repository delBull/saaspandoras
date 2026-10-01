import { DashApi } from '@/lib/dash-api';
import { Sparkles, Layers, ShieldCheck, Plus, ExternalLink, Cpu, Users } from 'lucide-react';
import { TenantDeployButton } from '@/components/growth/nft/TenantDeployButton';
import Link from 'next/link';


export default async function NftLabPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams.organizationSlug;
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
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            NFT Lab & Smart Tokens
          </h1>
          <p className="text-zinc-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Creación, minteo y emisión de certificados, membresías y pases VIP para {slugId.toUpperCase()}.
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]">
          <Plus className="w-5 h-5" />
          Nueva Colección
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {nftData.collections.map((col) => (
          <div key={col.id} className="relative rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl p-6 shadow-xl space-y-5 overflow-hidden group hover:border-indigo-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-3 py-1.5 rounded-md bg-white/5 text-zinc-300 border border-white/10">
                  {col.type}
                </span>
                <h3 className="text-xl font-black text-white mt-4 tracking-tight group-hover:text-indigo-400 transition-colors">{col.name}</h3>
                <p className="text-sm font-mono font-bold text-zinc-400 mt-1">${col.symbol}</p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                {col.status}
              </span>
            </div>

            {/* TenantPays deploy flow: pending confirm / awaiting deploy / awaiting tenant deploy */}
            {col.status === 'GOVERNANCE_PENDING' && (
              <TenantDeployButton
                collectionId={col.id}
                organizationSlug={slugId}
                deployConfig={{
                  name: col.name,
                  symbol: col.symbol,
                  maxSupply: col.totalSupply || 1000,
                  price: String(col.royaltyFeeBps ?? 0),
                  owner: '',
                  treasuryAddress: '',
                  transferable: col.transferable,
                  burnable: col.burnable,
                  nftType: String(col.purpose || 'Access'),
                  network: col.chainId ? (String(col.chainId) === '8453' ? 'base' : 'sepolia') : (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? 'base' : 'sepolia'),
                }}
              />
            )}

            {/* Supply Progress */}
            <div className="relative z-10 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-zinc-500">Minteados</span>
                <span className="text-white">{col.mintedSupply} / {col.totalSupply}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/10">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  style={{ width: `${(col.mintedSupply / (col.totalSupply || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Contract Info + Actions */}
            <div className="relative z-10 pt-5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Chain ID: {col.chainId} (Base)</span>
                </div>
                {col.contractAddress && (
                  <span className="text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:text-white cursor-pointer transition-colors">
                    {col.contractAddress.slice(0, 6)}...{col.contractAddress.slice(-4)}
                  </span>
                )}
              </div>
              <Link
                href={`/growth-os/organizations/${slugId}/nft-lab/collections/${col.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                Ver Titulares
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Supported Chains */}
      <div className="rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest font-mono relative z-10">Redes & Protocolos Soportados</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          {nftData.supportedChains.map((chain) => (
            <div key={chain.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center text-center justify-center gap-1 hover:bg-white/10 transition-colors">
              <p className="font-bold text-white text-sm">{chain.name}</p>
              <p className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">{chain.isTestnet ? 'Testnet' : 'Producción'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
