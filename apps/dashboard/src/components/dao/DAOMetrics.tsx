"use client";

import { VoteIcon, Users, Wallet, Zap } from "lucide-react";
import useSWR from "swr";

interface DAOMetricsProps {
    projectId: number;
    project?: any;
    licenseContract?: any; // Keep for backward compat if needed, but we use API
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function DAOMetrics({ projectId, project }: DAOMetricsProps) {
    const { data, error, isLoading } = useSWR(
        projectId ? `/api/dao/metrics?projectId=${projectId}` : null,
        fetcher,
        { refreshInterval: 30000 } // Refresh every 30s
    );

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-zinc-900 animate-pulse rounded-2xl border border-zinc-800" />
                ))}
            </div>
        );
    }

    const isToken = project?.token_type === 'erc20' || project?.tokenType === 'erc20' || project?.licenseToken?.type === 'erc20';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MEMBERS */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="w-12 h-12 text-blue-500" />
                </div>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Miembros Únicos</p>
                <h3 className="text-3xl font-black text-white font-mono">
                    {data?.members?.toLocaleString() ?? 0}
                </h3>
                <div className="mt-2 text-[10px] text-zinc-500">
                    {isToken ? 'Wallets verificadas en el DAO' : 'Poseedores de Access Card'}
                </div>
            </div>

            {/* VOTING POWER */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <VoteIcon className="w-12 h-12 text-purple-500" />
                </div>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Poder de Voto Total</p>
                <h3 className="text-3xl font-black text-purple-400 font-mono">
                    {data?.votingPower?.toLocaleString() ?? 0}
                </h3>
                <div className="mt-2 text-[10px] text-zinc-500">Suma total de derecho al voto</div>
            </div>

            {/* TREASURY */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wallet className="w-12 h-12 text-emerald-500" />
                </div>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Tesorería (Est.)</p>
                <h3 className="text-3xl font-black text-emerald-400 font-mono">
                    ${data?.treasury?.toLocaleString() ?? "0"}
                </h3>
                <div className="mt-2 text-[10px] text-zinc-500">Balance nativo del protocolo</div>
            </div>

            {/* GGE: GOVERNANCE INTELLIGENCE PANEL (High Level) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* PCI CARD */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Power Concentration Index (PCI)</p>
                            <h4 className="text-2xl font-black text-white italic">Governance IQ</h4>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            (data?.pci || 0) > 0.6 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                            (data?.pci || 0) > 0.4 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                            'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                            {(data?.pci || 0) > 0.6 ? 'Riesgo: Centralizado' : (data?.pci || 0) > 0.4 ? 'Aviso: Concentración' : 'Estado: Saludable'}
                        </div>
                    </div>
                    
                    <div className="flex items-end gap-4">
                        <div className="text-5xl font-black font-mono text-white">
                            {Math.round((data?.pci || 0) * 100)}%
                        </div>
                        <div className="flex-1 mb-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${
                                    (data?.pci || 0) > 0.6 ? 'bg-red-500' : (data?.pci || 0) > 0.4 ? 'bg-yellow-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${(data?.pci || 0) * 100}%` }}
                            />
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-zinc-500 uppercase font-bold tracking-tight">
                        Power held by top 10% of wallets vs total power.
                    </p>
                </div>

                {/* STRATEGIC INSIGHTS CARD */}
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">GGE: Automated Insights</h5>
                    </div>
                    <div className="space-y-3">
                        {data?.members > 0 ? (
                            <>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-zinc-300 font-medium">
                                    {data.pci > 0.6 ? (
                                        <span className="text-red-400 font-bold">⚠️ Alerta:</span>
                                    ) : (
                                        <span className="text-emerald-400 font-bold">✨ Salud:</span>
                                    )} {data.pci > 0.6 
                                        ? "Alta concentración de poder detectada. Riesgo de manipulación en gobernanza." 
                                        : "Distribución de poder equilibrada. El protocolo mantiene una descentralización saludable."}
                                </div>
                                {data?.attribution?.[0] && (
                                    <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10 text-xs text-zinc-300 font-medium">
                                        <span className="text-purple-400 font-bold">🎯 Influencia:</span> La campaña <span className="text-white">#{data.attribution[0].campaignId || 'Orgánico'}</span> controla el <span className="text-white">{Math.round(data.attribution[0].share * 100)}%</span> del poder total del DAO.
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-zinc-500 italic text-xs text-center py-4">Esperando datos de gobernanza para generar insights...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* STRATEGIC ATTRIBUTION (Full Width) */}
            {data?.attribution && data.attribution.length > 0 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl mt-4">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" /> Atribución de Gobernanza (Promotores)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {data.attribution.slice(0, 5).map((attr: any, idx: number) => {
                            const isTeam = attr.campaignId === 'FOUNDATION_TEAM';
                            const isPandoras = attr.campaignId === 'PANDORAS_PROTOCOL';
                            const label = isTeam ? 'Team Fundador' : isPandoras ? 'Pandoras (Core)' : `#${attr.campaignId || 'Orgánico'}`;
                            const colorClass = isTeam 
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                                : isPandoras 
                                ? 'bg-blue-500/10 text-blue-400 border-blue-400/30' 
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20';

                            return (
                                <div key={idx} className="bg-black/20 p-4 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${colorClass}`}>
                                            {label}
                                        </span>
                                        <span className="text-lg font-bold text-white font-mono">
                                            {Math.round(attr.share * 100)}%
                                        </span>
                                    </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-zinc-500 uppercase">Votos</span>
                                    <span className="font-bold text-zinc-300">{attr.votingPower}</span>
                                </div>
                                <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${isTeam ? 'bg-amber-500' : isPandoras ? 'bg-blue-400' : 'bg-purple-500'}`} 
                                        style={{ width: `${attr.share * 100}%` }}
                                    />
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            )}
        </div>
    );
}
