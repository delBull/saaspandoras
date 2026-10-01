import { ArrowLeft, Layers, Sparkles, Shield, Link2 } from 'lucide-react';
import Link from 'next/link';
import { IssuancesPanel } from '@/components/growth/nft/IssuancesPanel';

export default async function NftCollectionDetailPage({
  params,
}: {
  params: Promise<{ organizationSlug: string; collectionId: string }>;
}) {
  const { organizationSlug, collectionId } = await params;

  // API key for client-side requests — use public key from env
  // The IssuancesPanel uses this for its fetch calls
  const apiKey = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || '';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-6 md:p-8">

      {/* Back nav */}
      <Link
        href={`/growth-os/organizations/${organizationSlug}/nft-lab`}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors font-mono"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a NFT Lab
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Layers className="w-8 h-8 text-indigo-400" />
            Detalle de Colección
          </h1>
          <p className="text-zinc-400 text-sm mt-2 font-mono">
            {organizationSlug.toUpperCase()} · ID: <span className="text-indigo-400">{collectionId.slice(0, 8)}…</span>
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Sparkles, label: 'Estado', value: '—', color: 'text-indigo-400' },
          { icon: Shield, label: 'Standard', value: '—', color: 'text-purple-400' },
          { icon: Layers, label: 'Supply', value: '—', color: 'text-emerald-400' },
          { icon: Link2, label: 'Chain', value: '—', color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-[#09090D]/60 backdrop-blur-xl p-4 space-y-2">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">{stat.label}</p>
            <p className="text-lg font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Issuances Panel */}
      <div className="rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl p-6 shadow-xl">
        <IssuancesPanel
          collectionId={collectionId}
          organizationSlug={organizationSlug}
          apiKey={apiKey}
        />
      </div>

    </div>
  );
}
